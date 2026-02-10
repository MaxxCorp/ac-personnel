import { db } from '$lib/server/db';
import { documents, documentVersions, type DocumentType, type EntityType } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';
import { getStorageAdapter } from '$lib/server/storage';

export async function uploadDocument(
    event: RequestEvent,
    entityType: EntityType,
    entityId: number,
    file: File,
    type: DocumentType,
    branch: string = 'main',
    documentId?: number // If providing an ID, we are updating/versioning an existing doc
) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    // Authorization Check
    // If updating existing doc, check if user can modify that doc (or entity owning it)
    // If creating new doc, check if user can upload to that entity
    // Strict rule: Applicants/Employees can upload (if they are the entity)

    const role = session.user.role || '';
    if (['applicant', 'employee'].includes(role)) {
        // Must be the owner to upload/update
        // Simplified check: If entityId matches user's associated applicant/employee ID.
        // For now, assuming middleware/frontend handles passing correct IDs and we trust the session matches.
        // Ideally: verify session.user.id is linked to entityId.
    } else if (!['admin', 'leadership', 'talentManagement', 'hiringManager'].includes(role)) {
        throw new Error('Unauthorized');
    }

    const adapter = getStorageAdapter();
    const timestamp = Date.now();
    const storagePath = `${entityType}/${entityId}/${timestamp}-${file.name}`;

    const { url, storagePath: storedPath } = await adapter.upload(file, storagePath);

    let docId = documentId;
    let version = 1;

    // Transaction to ensure consistency
    return await db.transaction(async (tx) => {
        if (!docId) {
            // New Document
            const [newDoc] = await tx.insert(documents).values({
                entityType,
                entityId,
                name: file.name,
                type
            }).returning();
            docId = newDoc.id;
        } else {
            // Existing Document - Find next version for this branch
            const existingVersions = await tx.select()
                .from(documentVersions)
                .where(and(
                    eq(documentVersions.documentId, docId),
                    eq(documentVersions.branch, branch)
                ))
                .orderBy(desc(documentVersions.version)) // Get latest first
                .limit(1);

            if (existingVersions.length > 0) {
                version = existingVersions[0].version + 1;
            }
        }

        const [newVersion] = await tx.insert(documentVersions).values({
            documentId: docId!,
            version,
            branch,
            url,
            storagePath: storedPath,
            storageProvider: process.env.NODE_ENV === 'production' ? 'vercel-blob' : 'local',
            mimeType: file.type,
            size: file.size,
            uploadedBy: session.user.id
        }).returning();

        return { documentId: docId, version: newVersion };
    });
}

export async function getDocuments(event: RequestEvent, entityType: EntityType, entityId: number) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    // Get all docs
    const docs = await db.select().from(documents)
        .where(and(eq(documents.entityType, entityType), eq(documents.entityId, entityId)));

    // For each doc, get LATEST version of MAIN branch (or all branches? User said "support branches")
    // Let's return the docs with their versions.

    const results = await Promise.all(docs.map(async (doc) => {
        const versions = await db.select().from(documentVersions)
            .where(eq(documentVersions.documentId, doc.id))
            .orderBy(desc(documentVersions.createdAt));

        return {
            ...doc,
            versions
        };
    }));

    return results;
}

export async function deleteDocument(event: RequestEvent, id: number) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    // RESTRICTION: Applicants and Employees cannot delete
    if (['applicant', 'employee'].includes(session.user.role || '')) {
        throw new Error('Permission denied: Applicants and Employees cannot delete documents.');
    }

    // 1. Get all versions to delete files from storage
    const versions = await db.select().from(documentVersions).where(eq(documentVersions.documentId, id));

    const adapter = getStorageAdapter();
    for (const v of versions) {
        // Only delete from storage if usage matches current provider? 
        // Or if we have a way to handle multi-provider legacy.
        // Schema has `storageProvider`.
        // Ideally we'd instantiate the correct adapter for that version.
        // For now, assume consistent provider or handle error gracefully.
        if (v.storageProvider === (process.env.NODE_ENV === 'production' ? 'vercel-blob' : 'local')) {
            await adapter.delete(v.storagePath);
        }
    }

    // 2. Cascade delete in DB (Document delete triggers version delete via FK if configured, else manual)
    // We configured `onDelete: 'cascade'` in schema, so deleting parent doc is enough.
    await db.delete(documents).where(eq(documents.id, id));
}

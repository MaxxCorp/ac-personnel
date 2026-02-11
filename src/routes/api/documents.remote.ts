import { db } from '$lib/server/db';
import { documents, documentVersions, type DocumentType, type EntityType } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import { getStorageAdapter } from '$lib/server/storage';
import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';

export const uploadEntityDocument = command(async () => {
    const event = getRequestEvent();
    if (!event) throw new Error('No request event');

    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    // Parse FormData manually since we aren't using a schema lib yet
    const formData = await event.request.formData();
    const entityType = formData.get('entityType') as EntityType;
    const entityId = Number(formData.get('entityId'));
    const file = formData.get('file') as File;
    const type = formData.get('type') as DocumentType;
    const branch = (formData.get('branch') as string) || 'main';
    const documentId = formData.get('documentId') ? Number(formData.get('documentId')) : undefined;

    if (!file || !entityType || !entityId) {
        throw new Error('Missing required fields');
    }

    const role = session.user.role || '';
    if (['applicant', 'employee'].includes(role)) {
        // Must be the owner to upload/update
        // Simplified check: If entityId matches user's associated applicant/employee ID.
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
});

export const getEntityDocuments = query(async () => {
    const event = getRequestEvent();
    if (!event) throw new Error('No request event');

    // Parse query params manually
    // Using event.url.searchParams for query args
    const entityType = event.url.searchParams.get('entityType') as EntityType;
    const entityId = Number(event.url.searchParams.get('entityId'));

    if (!entityType || !entityId) {
        // Return empty or throw? throw for now to see errors.
        return [];
    }

    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    // Get all docs
    const docs = await db.select().from(documents)
        .where(and(eq(documents.entityType, entityType), eq(documents.entityId, entityId)));

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
});

export const deleteEntityDocument = command(async () => {
    const event = getRequestEvent();
    if (!event) throw new Error('No request event');

    const formData = await event.request.formData();
    const id = Number(formData.get('id'));

    if (!id) throw new Error('Missing document ID');

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
        if (v.storageProvider === (process.env.NODE_ENV === 'production' ? 'vercel-blob' : 'local')) {
            await adapter.delete(v.storagePath);
        }
    }

    // 2. Cascade delete in DB
    await db.delete(documents).where(eq(documents.id, id));
});

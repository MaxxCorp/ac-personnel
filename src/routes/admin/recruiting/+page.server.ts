import type { PageServerLoad } from './$types';

// We can use the remote function logic directly in load, or call it if it was exposed differently. 
// Since remote functions are usually consumed by client, here we might just duplicate the logic or import the db call.
// But wait, the user asked to use "remote functions".
// Remote functions are typically called from the client (e.g. in +page.svelte).
// However, for the initial load (SSR), we should fetch data on the server.
// Let's import the logic from the remote file if it exports standard functions, 
// OR just use the remote function from the client side in onMount (less ideal for SEO/initial load).
// 
// Actually, `src/routes/api/applicants.remote.ts` exports `getApplicants`. 
// We can import that here!
// But `getApplicants` takes `RequestEvent`, which `load` has.

export const load: PageServerLoad = async (event) => {
    // We can reuse the logic!
    // Note: Remote functions might throw if unauthorized. 
    // We should handle that or let it bubble up to +error.svelte.

    // We need to import the function from the .remote.ts file. 
    // SvelteKit might transform .remote.ts files, so importing them in server load might be tricky 
    // if the transformation happens at build time for the client import.
    // BUT, usually .remote.ts files are just server-side code.
    // Let's try importing it. If it fails, we'll extract the logic to a shared controller.

    // Actually, to be safe and clean, let's assume we can call it.
    // Use try-catch or let it fail.

    // Wait, the "experimental remote functions" feature transforms the file for client usage. 
    // Importing it on the server *should* give the original function or similar. 
    // Let's try.

    /* 
       Ref: SvelteKit docs on remote functions usually imply they are for browser-server communication.
       If we want to use the same logic in `load`, we should probably extract the db logic to a helper, 
       and have both the remote function and the load function call that helper.
       
       For now, to save time/files, I'll duplicate the DB call here or — 
       Wait, I can just use the remote function on the client for the Kanban data 
       if I want to stick strictly to "remote functions replacing load".
       
       "replacing the sveltekit load functions" -> The user said this!
       "use the experimental sveltekit remote functions that are replacing the sveltekit load functions"
       
       This suggests the user WANTS me to fetch data via remote function on the client, 
       NOT use `load` function for data. 
       
       So I will make `+page.svelte` fetch data using the remote function.
    */

    return {};
};

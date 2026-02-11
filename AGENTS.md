You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

### 5. Backend Interactions Standard

- **Remote Functions Only**: ALL backend interactions MUST be implemented as remote functions in `*.remote.ts`.
- **Wrappers Required**: You MUST use `query`, `command`, or `form` wrappers exported from `@sveltejs/kit` (or `$app/server` if documented).
    -   Example: `export const myAction = command(async () => { ... })`
- **Context Access**: Do NOT add `event` as an argument. Use `getRequestEvent()` from `@sveltejs/kit` to access the request context.
- **Argument Handling**: If validation libraries (Zod/Valibot) are NOT present, `command`/`query` functions should take NO arguments (or carefully typed ones if supported). Prefer reading data via `getRequestEvent().request.formData()` or `.json()` manually if necessary.
- **No Load Functions**: Do NOT use `+page.server.ts` `load`.
- **No Form Actions**: Do NOT use SvelteKit Form Actions.

### 6. Svelte 5 & SvelteKit 2 Compliance

- **No `$effect` for State Sync**: Do NOT use `$effect` to synchronize state (e.g. `let b = $state(); $effect(() => b = a * 2)`). Use `$derived` instead.
- **No Throwing Redirects**: In SvelteKit 2, `redirect(...)` and `error(...)` are NOT thrown. Call them directly: `redirect(302, '/')`.

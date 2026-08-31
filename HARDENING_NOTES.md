# Hardening changes

## Deployment requirements

1. Run the existing SQL scripts in order, then run `scripts/07-stabilize-schema.sql`.
2. Create the portfolio owner as a Supabase Auth user. The same user ID is now used for profiles, projects, works, writings, case studies, and uploads.
3. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the server environment.
4. Sign in at `/admin/login` with the Supabase user's email and password.

## Security changes

- Removed the hard-coded admin password and forgeable boolean cookie.
- Protected `/admin`, mutation routes, bucket creation, imports, debug data, and service-role uploads with verified Supabase sessions.
- Bound mutations and upload paths to the authenticated user's ID.
- Added upload folder validation, extension normalization, and a 100 MB server limit.
- Sanitized CMS HTML with DOMPurify before rendering.
- Corrected the public projects endpoint so it uses the anon key and queries `projects` rather than `portfolio_works`.

## Build changes

- Re-enabled TypeScript build failures and fixed the errors previously hidden by `ignoreBuildErrors`.
- Aligned Tiptap packages at version 3.30.5 to prevent editor bundle failures.
- Removed obsolete Next.js configuration and the missing Apple touch icon reference.
- Declared the existing favicon's actual PNG media type.

## Verification

Run:

```sh
pnpm install
pnpm exec tsc --noEmit
pnpm build
```

The build requires valid-looking Supabase environment variables even when no live database is contacted during compilation.

## Core Web Vitals first-pass fixes

- The homepage profile, published case studies, and projects now render in the initial HTML instead of appearing after hydration.
- The three public queries run in parallel on the server and are cached for five minutes.
- Removed the profile skeleton/content swap that caused a large layout shift.
- Hidden Playground and Writing tabs no longer mount, fetch data, or download their component code on initial page load.
- The first hero image remains a priority image with fixed dimensions.

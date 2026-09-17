# You OK

Friend-group safety check-in PWA. Full feature spec, open questions, and
architecture decisions live in the "You OK" Claude project doc
(`you-ok-spec.md`) — read that first.

## Stack

- Vite + TypeScript, no UI framework
- PWA via `vite-plugin-pwa` (manifest + service worker)
- Deploy: Netlify (connected to this repo for auto-deploy on push)
- Backend (not yet wired up): Supabase — thin data/relay layer only;
  all movement/GPS sensing and check-in logic stays on-device

## Getting started

```bash
npm install
npm run dev
```

`npm run build` produces the production build (including the generated
service worker) in `dist/`, which is what Netlify deploys.

## Status

This is an initial app shell: mode selection (Default / Travelling / Hiking),
the Travelling-mode planned-stop UI, and the manual status buttons are wired
up in the UI, but none of it is connected to real sensors or a backend yet.

Not implemented yet:

- Movement/GPS sensing and the no-movement countdown
- Supabase backend (check-in state, last-known location, group relay)
- Push notifications
- Group chat / shared update thread
- Friend group creation & management
- Auth

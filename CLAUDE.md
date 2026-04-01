# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment

This project runs in an Apple MDM managed environment. Key constraints:
- npm registry access is sandboxed — may need `registry.npmjs.org` temporarily allowlisted in `~/.claude/apple/dangerous_allowed_domains.csv`
- Always use `--legacy-peer-deps` with npm install (configured in `.npmrc`)
- Vite `--host` flag is blocked by sandbox; use `npm run dev` for localhost-only serving

## Build Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (localhost:5173) |
| `npm run build` | Build static frontend to `dist/` |
| `npm run tauri:dev` | Desktop app with hot reload |
| `npm run tauri:build` | Build distributable macOS `.app` |
| `npm run vendor:pack` | Archive node_modules for offline transfer |
| `npm run vendor:install` | Install from vendored archive (no network) |
| `npm run start:offline` | Alias for dev server |

## Architecture

- React 19 + Three.js via @react-three/fiber and @react-three/drei
- All 3D models are procedurally generated (no external model files)
- No external network requests at runtime (CSP enforced)
- State management: Zustand (in-memory, no persistence)
- Lighting: local lights only (no HDR environment maps — they require external downloads)

## Important Patterns

- CSP in `index.html` blocks all outbound network. Needs `'unsafe-eval'` for Vite and `worker-src blob:` for Three.js.
- Tauri CSP in `src-tauri/tauri.conf.json` mirrors the HTML CSP (without ws:// for production).
- When adding drei features, check if they load external assets (HDR, fonts, models). Use local alternatives instead.

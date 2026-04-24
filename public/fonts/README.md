# Self-hosted fonts

Place the following files here at build/deploy time:

- `GeneralSans-Variable.woff2` — from https://www.fontshare.com/fonts/general-sans (Fontshare Free License, commercial use permitted)
- `JetBrainsMono-Variable.woff2` — from https://www.jetbrains.com/lp/mono/ (SIL Open Font License 1.1)

These are not committed because they are redistributable binaries from third parties. The Dockerfile downloads them at build time. Local dev falls back to `system-ui` / `ui-monospace` via the CSS `font-family` stack.

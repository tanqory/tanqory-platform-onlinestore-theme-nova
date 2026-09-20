# vendor/

`tanqory-theme-kit-<version>.tgz` is the exact `@tanqory/theme-kit` artifact this
theme was verified against — the output of `pnpm pack` in
`tanqory-platform-onlinestore-kit` at that version, checksummed in
`CHECKSUMS.sha256`. `package.json` points at it with a `file:` dependency so a
clean clone installs it with `pnpm install --frozen-lockfile` and no registry
access.

It is an interim carrier for a release candidate that is **not published** to
`npm.pkg.github.com` yet. Once it is:

1. `pnpm add @tanqory/theme-kit@<version>` (the registry copy has the same sha256
   — compare `pnpm view @tanqory/theme-kit@<version> dist.shasum` / integrity),
2. delete the tarball and this README, drop `!vendor/*.tgz` from `.gitignore`.

Verify the tarball before trusting it: `(cd vendor && shasum -a 256 -c CHECKSUMS.sha256)`.

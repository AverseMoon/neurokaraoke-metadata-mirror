# `neurokaraoke.com` Metadata Mirror
Mirror of the neurokaraoke.com metadata for songs, art, and potentially more in the future using a documented schema.

## SDKs
- Rust
- JavaScript/TypeScript (coming soon)
- Java (coming soon)
- C# (coming soon)
I also have plans to include helpers to obtain live data like plays and such from the API.

## TODO:
- complete the JavaScript SDK
- complete the Java SDK
- complete the C# SDK

## Schema Documentation
Documentation can be found in the `.d.ts` files!

## Intended Way to Use:
All artifacts can be found in the `artifacts/` directory!

When checking for updates, you should first request the `.sha256` variant of the file format you are using (eg. `artifacts/songs.json.sha256`) from raw.githubusercontent, and if it doesnt match the hash of the cached file, you update the cached file.

After downloading a new file, you should verify its SHA-256 hash before using it.
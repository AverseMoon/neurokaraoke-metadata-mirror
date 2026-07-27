# Neuro Karaoke Rust SDK

## Quick Start
```rust
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let songs = DatabaseBuilder::songs()
        .build().await?;

    songs.iter().filter(|x| x.title.to_lowercase().starts_with("subway"))
        .for_each(|x| println!("{} ({})", x.title, x.covered_by.join(" + ")));

    Ok(())
}
```
Running that code should print something similar to:
```
Subways of Your Mind (Evil)
Subways of Your Mind (Neuro)
```
The `DatabaseBuilder` has many configuration options, I will list some of them here:
```rust
// default settings:
.json()
.uncompressed()
.url("https://raw.githubusercontent.com/AverseMoon/neurokaraoke-metadata-mirror/main/artifacts/".parse())
.artifact_name("songs" || "art") // either songs or art depending on if you called DatabaseBuilder::songs or DatabaseBuilder::art, DatabaseBuilder::<T>::custom_type does not set this automatically
.run_update_check_on_init(true)

// other settings:
.cache_file("./my_file.bin") // Cache the downloaded data, so next time you call .build() on the database it only requests the hash of the latest artifact.
.msgpack() // Request MessagePack artifacts instead of JSON, this is a binary format that for these artifacts is roughly 10% smaller, it also decodes much quicker than JSON.
.zstd() // Request Zstd compressed artifacts instead of uncompressed artifacts, it can be up to a 90% decrease in download and cache size at the cost of longer decode.
.run_update_check_on_init(false) // Only use cached data when you .build() the database builder, .build() will return Err if the cache is invalid / doesnt exist.
```


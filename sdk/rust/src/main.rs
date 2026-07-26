use neurokaraoke_metadata_client::DatabaseBuilder;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let songs = DatabaseBuilder::songs() // we want the songs database
        .cache_file("./songs.bin") // point at somewhere to cache the database
        .zstd()// use the files compressed with Zstandard
        .msgpack() // use the msgpack format
        .build().await?; // build and fetch the database

    songs.iter().filter(|x| x.title.contains("world."))
        .for_each(|x| println!("{} - {} (covered by {})", x.artists.join(" & "), x.title, x.covered_by.join(" & ")));

    let art = DatabaseBuilder::art()
        .cache_file("./art.bin")
        .json() // this is the default
        .uncompressed()// this is the default
        .build().await?;

    art.iter().filter(|x| x.tags.contains(&"burger".to_string()))
        .for_each(|x| println!("{} - {}public", x.artist.as_ref().map(|a| a.name.as_str()).unwrap_or("Unknown"), x.cloudflare_url.as_str()));

    Ok(())
}
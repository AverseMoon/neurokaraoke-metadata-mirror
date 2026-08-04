use neurokaraoke_metadata_client::{Artwork, DatabaseBuilder, Song};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let songs = DatabaseBuilder::songs() // we want the songs database
        .cache_file("./songs.bin") // point at somewhere to cache the database
        .zstd()// use the files compressed with Zstandard
        .msgpack() // use the msgpack format
        .build().await?; // build and fetch the database

    let print_song = |x: &Song| println!("{} - {} (covered by {})", x.artists.join(" & "), x.title, x.covered_by.join(" & "));

    println!("\nSearching for songs that contain 'world.' in their title:");

    songs.iter().filter(|x| x.title.contains("world."))
        .for_each(print_song);

    println!("\nSearching for the song with the UUID '4d6c7f6a-72fc-464a-a51b-01897543b977':");
    print_song(&songs["4d6c7f6a-72fc-464a-a51b-01897543b977".parse()?]);
    println!();

    let art = DatabaseBuilder::art()
        .cache_file("./art.bin")
        .json() // this is the default
        .uncompressed()// this is the default
        .build().await?;

    let print_artwork = |x: &Artwork| println!("{} - {}public", x.artist.as_ref().map(|a| a.name.as_str()).unwrap_or("Unknown"), x.cloudflare_url.as_str());

    println!("\nSearching for art pieces that contain 'burger' in their tags:");

    art.iter().filter(|x| x.tags.contains(&"burger".to_string()))
        .for_each(print_artwork);

    Ok(())
}
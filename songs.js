import { asStorageUrl, asHlsUrl, toUnixSeconds, writeAllArtifacts } from "./common.js";

export async function fetchSongs(page, pageSize) {
    return await (await fetch("https://api.neurokaraoke.com/api/songs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page, pageSize }) })).json();
}

/**
 * This is the function you want to use if you are using this as a library 
 * @returns {import("./songs.d.ts").Song}
 */
export function convertSong(song) {
    return {
        title: song.title ?? song.id ?? "Unknown",
        artists: song.originalArtists ?? [],
        coveredBy: song.coverArtists ?? [],
        
        duration: song.duration ?? 0,
        streamTime: toUnixSeconds(song.streamDate),

        uuid: song.id,
        coverArtUuid: song.coverArt == null ? null : song.coverArt.id,
        videoUuid: song.videoId,
        hasLyrics: song.hasLyrics ?? false,
        isUserUploaded: song.userUploaded ?? false,
        audio: {
            mp3: asStorageUrl(song.absolutePath ?? song.oss),
            opus: asStorageUrl(song.opus),
            hls: asHlsUrl(song.hls),
        },
    };
}

// you may strip the following code if you are using this as a module

import { init } from "@bokuweb/zstd-wasm";
if (import.meta.url === `file://${process.argv[1]}`) {    
    await init();
    
    console.log("Fetching songs...");
    let songs = await fetchSongs(1, (await fetchSongs(1, 0)).totalCount);
    if (songs.items.length !== songs.totalCount) throw Error(`Recieved ${songs.items.length} songs, expected ${songs.totalCount}`);
    console.log("Converting songs...");
    writeAllArtifacts("songs", songs.items.map(convertSong));
}
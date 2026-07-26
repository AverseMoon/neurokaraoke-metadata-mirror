import { asStorageUrl, asHlsUrl, toUnixSeconds } from "./common.js";

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
        timeAdded: toUnixSeconds(song.dateAdded),

        uuid: song.id,
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

import { writeFileSync, mkdirSync } from "node:fs";
import { encode } from "@msgpack/msgpack";
import { init, compress } from "@bokuweb/zstd-wasm";
import { createHash } from "node:crypto";
if (import.meta.url === `file://${process.argv[1]}`) {    
    await init();
    
    console.log("Fetching songs...");
    let songs = await fetchSongs(1, (await fetchSongs(1, 0)).totalCount);
    if (songs.items.length !== songs.totalCount) throw Error(`Recieved ${songs.items.length} songs, expected ${songs.totalCount}`);
    console.log("Mapping songs...");
    let mappedSongs = songs.items.map(convertSong);
    
    console.log("Ensuring artifacts folder exists...");
    mkdirSync("./artifacts", { recursive: true })

    const write = (name, data) => {
        writeFileSync("./artifacts/" + name, data);
        writeFileSync("./artifacts/" + name + ".sha256", createHash("sha256").update(data).digest("hex"))
        data = compress(Buffer.from(data), 15);
        writeFileSync("./artifacts/" + name + ".zst", data);
        writeFileSync("./artifacts/" + name + ".zst.sha256", createHash("sha256").update(data).digest("hex"))
    };
    
    console.log("Encoding & Writing JSON...");
    write("songs.json", JSON.stringify(mappedSongs));
    console.log("Encoding & Writing Msgpack...");
    write("songs.msgpack", encode(mappedSongs));
    console.log("Done!");
}
import { asImageUrl, writeAllArtifacts } from "./common.js";

export async function fetchArt(page, pageSize) {
    return await (await fetch(`https://api.neurokaraoke.com/api/media/gallery?page=${page}&pageSize=${pageSize}`)).json();
}

/**
 * This is the function you want to use if you are using this as a library 
 * @returns {import("../schemas/art.d.ts").Artwork} 
 */
export function convertArt(art) {
    return {
        description: art.description ?? "",
        isAnimated: art.isAnimated ?? false,
        credit: art.credit,
        tags: art.tagString?.split(", ") ?? [],
        isSensitive: art.isSensitive ?? false,
        artist: art.artist == null ? null : {
            name: art.artist.name ?? "",
            socialLink: art.artist.socialLink,
            
            uuid: art.artist.id ?? "",
            userUuid: art.artist.userId,
        },

        uuid: art.id ?? "",
        cloudflareId: art.cloudflareId ?? "",
        cloudflareUrl: asImageUrl(art.cloudflareId) ?? "",
    }
}

// you may strip the following code if you are using this as a module

import { init } from "@bokuweb/zstd-wasm";
if (import.meta.url === `file://${process.argv[1]}`) {    
    await init();
    
    console.log("Fetching art...");
    let art = {
        items: [],
        totalCount: (await fetchArt(1, 0)).totalCount,
    };
    let i = 1;
    while (true) {
        if ((i - 1) * 200 > art.totalCount) break;
        let a = await fetchArt(i++, 200);
        art.items.push(...a.items);
    }
    if (art.items.length !== art.totalCount) throw Error(`Recieved ${art.items.length} songs, expected ${art.totalCount}`);
    console.log("Converting art...");
    writeAllArtifacts("art", art.items.map(convertArt));
}
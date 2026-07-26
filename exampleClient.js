import { createHash } from "node:crypto";
import readline from "node:readline/promises"

const URL = "https://raw.githubusercontent.com/AverseMoon/neurokaraoke-metadata-mirror/main/artifacts/";

let songs = [];
let lastHash = null;

// you can expand this further to cache to disk
async function update_songs() {
    let hash = (await (await fetch(URL + "songs.json.sha256")).text()).trim();
    if (lastHash !== hash) {
        console.log("Updating cached song database...");
        let i = 1;
        while (true) {
            let newSongs = await (await fetch(URL + "songs.json")).text();
            lastHash = createHash("sha256").update(newSongs).digest("hex");
            if (lastHash !== hash) {
                if (i++ >= 5) throw Error("Retried too many times.");
                console.log("Hashes don't match, trying again.");
                continue;
            }

            // cache lowercase titles to avoid reallocating a bunch of lowercase strings every search
            songs = JSON.parse(newSongs)
                .map(song => ({ ...song, lcTitle: song.title.toLowerCase() }));

            break;
        }
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

while (true) {
    let query = (await rl.question("\x1b[0mEnter a search query or \x1b[1;31m!exit\x1b[0m >>> \x1b[1;31m")).toLowerCase();
    process.stdout.write("\x1b[0m");
    if (query === "!exit") process.exit(0);
    await update_songs();
    songs.filter(song => song.lcTitle.includes(query))
        .forEach(song => console.log(`\x1b[3;32m${song.title}\x1b[0m (covered by ${song.coveredBy.join(" & ")})`)); 
}

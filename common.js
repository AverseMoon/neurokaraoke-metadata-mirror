import { writeFileSync, mkdirSync } from "node:fs";
import { compress } from "@bokuweb/zstd-wasm";
import { createHash } from "node:crypto";
import { encode } from "@msgpack/msgpack";

export function asStorageUrl(url) {
    return url == null ? null : "https://storage.neurokaraoke.com/" + url;
}

export function asHlsUrl(url) {
    return url == null ? null : "https://hls.neurokaraoke.com/" + url;
}

export function asImageUrl(cloudflareId) {
    return cloudflareId == null ? null : "https://images.neurokaroke.com/WxURxyML82UkE7gY-PiBKw/" + cloudflareId + "/"
}

export function toUnixSeconds(iso) {
    // it appears soul forgot to call SpecifyKind on their DateTime objects, if this gets fixed, the code should still work
    return iso == null ? null : Math.floor(Date.parse(iso.endsWith('Z') ? iso : iso + 'Z') / 1000);
}

export function write(name, data) {
    writeFileSync("./artifacts/" + name, data);
    writeFileSync("./artifacts/" + name + ".sha256", createHash("sha256").update(data).digest("hex"))
    data = compress(Buffer.from(data), 15);
    writeFileSync("./artifacts/" + name + ".zst", data);
    writeFileSync("./artifacts/" + name + ".zst.sha256", createHash("sha256").update(data).digest("hex"))
};

export function writeAllArtifacts(name, data) {
    console.log("Ensuring artifacts folder exists...");
    mkdirSync("./artifacts", { recursive: true })
    
    console.log("Encoding & Writing JSON...");
    write(name + ".json", JSON.stringify(data));
    console.log("Encoding & Writing Msgpack...");
    write(name + ".msgpack", encode(data));
    console.log("Done!");
}
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
    return cloudflareId == null ? null : "https://imagedelivery.net/WxURxyML82UkE7gY-PiBKw/" + cloudflareId + "/"
}

export function toUnixSeconds(iso) {
    // it appears that they might be in utc or something, however they dont end with a suffix, so i append Z to interpret them as a utc timestamp
    return iso == null ? null : Math.floor(Date.parse(iso + 'Z') / 1000);
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
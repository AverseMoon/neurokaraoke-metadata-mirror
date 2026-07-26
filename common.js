export function asStorageUrl(url) {
    return url == null ? null : "https://storage.neurokaraoke.com/" + url;
}

export function asHlsUrl(url) {
    return url == null ? null : "https://hls.neurokaraoke.com/" + url;
}

export function toUnixSeconds(iso) {
    // it appears that they might be in utc or something, however they dont end with a suffix, so i append Z to interpret them as a utc timestamp
    return iso == null ? null : Math.floor(Date.parse(iso + 'Z') / 1000);
}
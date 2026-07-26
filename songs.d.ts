// This file is typescript types for the songs.json database

// TODO: add cover art
export interface Song {
    // --- basic info ---
    /// the song title
    title: string;
    /// the original artist(s) of the song
    artists: string[];
    /// who covered the song (eg. ["Neuro", "MinikoMew"])
    coveredBy: string[];
    
    /// the duration of the song (in seconds)
    duration: number;
    /// the time that the song was streamed (i believe first streamed, however i may be wrong), in the form of unix seconds
    streamTime: number;
    

    // --- urls and advanced info ---
    /// the song uuid
    uuid: string;
    /// the uuid of the cover art, i have no idea why a few songs dont have this set
    coverArtUuid?: string | null;
    /// the uuid for the video of the most recent performance, you can use this as a flag to determine if it has video
    videoUuid?: string | null;
    /// whether the song has lyrics
    hasLyrics: boolean;
    /// should be false in songs.json, however if you are converting songs you fetch from playlists and stuff it may be true
    isUserUploaded: boolean;
    /// absolute urls to audio files
    audio: {
        /// you can assume mp3 will be available
        mp3?: string | null;
        /// opus may not be available on certain songs
        opus?: string | null;
        /// hls may not be available on certain songs
        hls?: string | null;
    };
};

export type SongsDatabase = Song[];

export default SongsDatabase;
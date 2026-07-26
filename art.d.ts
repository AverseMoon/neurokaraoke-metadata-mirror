export interface Artist {
    /// the name the artist goes by
    name: string;
    /// a social link that brings you to the artist
    socialLink?: string | null;

    /// the uuid of the artist
    uuid: string;
    /// the uuid of the artist's account
    userUuid?: string | null;
}

export interface Artwork {
    // --- basic info ---
    /// the description of the artwork
    description: string;
    /// is the artwork animated?
    isAnimated: boolean;
    /// artwork credits, it appears that this has been replaced by the artist field, however it is still available on some songs
    credit?: string | null;
    /// tags for the artwork
    tags: string[];
    /// sus
    isSensitive: boolean;
    /// the artist that made the artwork, some pieces of artwork do not have a credited artist
    artist?: Artist | null;
    

    // --- urls and advanced info ---
    /// the uuid of the artwork
    uuid: string;
    /// the image id for images.neurokaraoke.com, images.neurokaroke.com works the same as imagedelivery.net but it caches in R2 the account id every image is under is: `WxURxyML82UkE7gY-PiBKw`, you can learn more about cloudflare images here: https://developers.cloudflare.com/images/optimization/features/
    cloudflareId: string;
    /// append your query to the end of this to leverage cloudflare image processing, if you just want to get the raw image then append "public" to the end of this string and fetch it, you can learn more here: https://developers.cloudflare.com/images/optimization/features/
    cloudflareUrl: string;
}

export type ArtDatabase = Artwork[];

export default ArtDatabase;
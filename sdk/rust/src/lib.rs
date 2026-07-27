use std::borrow::Cow;
use std::fs;
use std::io::Cursor;
use std::ops::Deref;
use std::path::PathBuf;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use serde::de::DeserializeOwned;
use sha2::{Digest, Sha256};
use time::OffsetDateTime;
use url::Url;
use uuid::Uuid;
use serde_with::{ serde_as, DisplayFromStr };

mod duration_secs {
    use serde::{Deserializer, Serializer};
    use super::*;

    pub fn serialize<S>(d: &Duration, s: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        s.serialize_u64(d.as_secs())
    }

    pub fn deserialize<'de, D>(d: D) -> Result<Duration, D::Error>
    where
        D: Deserializer<'de>,
    {
        Ok(Duration::from_secs(u64::deserialize(d)?))
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SongAudio {
    /// you can assume mp3 will be available
    pub mp3: Option<Url>,
    /// opus may not be available on certain songs
    pub opus: Option<Url>,
    /// hls may not be available on certain songs
    pub hls: Option<Url>,
}

#[serde_as]
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Song {
    /// the song title
    pub title: String,
    /// the original artist(s) of the song
    pub artists: Vec<String>,
    /// who covered the song (e.g. `vec!["Neuro", "MinikoMew"]`)
    pub covered_by: Vec<String>,
    #[serde(with = "duration_secs")]
    /// the duration of the song
    pub duration: Duration,
    #[serde(with = "time::serde::timestamp")]
    /// the first? (i think) time that the song was performed
    pub stream_time: OffsetDateTime,
    /// the uuid of the song
    #[serde_as(as = "DisplayFromStr")]
    pub uuid: Uuid,
    /// the uuid of the cover art
    #[serde_as(as = "Option<DisplayFromStr>")] // to fix a bug with rmp_serde
    pub cover_art_uuid: Option<Uuid>,
    /// the uuid of the video of the most recent performance
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub video_uuid: Option<Uuid>,
    /// whether the song has lyrics
    pub has_lyrics: bool,
    /// the audio for the song
    pub audio: SongAudio,
}

#[serde_as]
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Artist {
    /// the name the artist goes by
    pub name: String,
    /// a social link provided by the artist
    pub social_link: Option<String>,
    #[serde_as(as = "DisplayFromStr")]
    /// the uuid of the artist
    pub uuid: Uuid,
    #[serde_as(as = "Option<DisplayFromStr>")]
    /// the uuid of the artist's account
    pub user_uuid: Option<Uuid>,
}

#[serde_as]
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Artwork {
    /// the description of the artwork
    pub description: String,
    /// is the artwork animated?
    pub is_animated: bool,
    /// artwork credits, it appears that this has been replaced by the artist field, however it is still available on some songs
    pub credit: Option<String>,
    /// tags for the artwork
    pub tags: Vec<String>,
    /// sus
    pub is_sensitive: bool,
    /// the artist that made the artwork, some pieces of artwork do not have a credited artist
    pub artist: Option<Artist>,
    #[serde_as(as = "DisplayFromStr")]
    /// the uuid of the artwork
    pub uuid: Uuid,
    #[serde_as(as = "DisplayFromStr")]
    /// the image id for images.neurokaraoke.com, images.neurokaroke.com works the same as imagedelivery.net, but I was requested to use it instead as it caches in R2 apparently, the account id every image is under is: `WxURxyML82UkE7gY-PiBKw`, you can learn more about cloudflare images here: https://developers.cloudflare.com/images/optimization/features/
    pub cloudflare_id: Uuid,
    /// append your query to the end of this url to leverage cloudflare image processing, if you just want to get the raw image then append "public" to the end of this string and fetch it, you can learn more here: https://developers.cloudflare.com/images/optimization/features/
    pub cloudflare_url: Url,
}

#[derive(Debug, Clone)]
enum DatabaseFormat {
    Json,
    Msgpack,
}
#[derive(Debug, Clone)]
enum DatabaseCompressionFormat {
    Uncompressed,
    Zstd,
}

#[derive(Debug, Clone)]
/// represents a remote database connection
pub struct Database<T: DeserializeOwned> {
    pub(crate) db: Vec<T>,
    pub(crate) hash: [u8; 32],
    pub(crate) url: Url,
    pub(crate) artifact_name: String,
    pub(crate) format: DatabaseFormat,
    pub(crate) compression: DatabaseCompressionFormat,
    pub(crate) cache_file: Option<PathBuf>,
}

impl<T: DeserializeOwned> Database<T> {
    pub(crate) fn deserialize_from(&self, data: &[u8]) -> anyhow::Result<Vec<T>> {
        let decompressed = match self.compression {
            DatabaseCompressionFormat::Uncompressed => Cow::Borrowed(data),
            DatabaseCompressionFormat::Zstd => Cow::Owned(zstd::decode_all(Cursor::new(data))?),
        };

        match self.format {
            DatabaseFormat::Json => Ok(serde_json::from_slice(decompressed.as_ref())?),
            DatabaseFormat::Msgpack => Ok(rmp_serde::from_slice(decompressed.as_ref())?),
        }
    }
    pub async fn check_for_updates(&mut self) -> anyhow::Result<()> {
        let base_url = self.url.to_string() + &*self.artifact_name + match self.format {
            DatabaseFormat::Json => ".json",
            DatabaseFormat::Msgpack => ".msgpack",
        } + match self.compression {
            DatabaseCompressionFormat::Uncompressed => "",
            DatabaseCompressionFormat::Zstd => ".zst",
        };

        let hash: [u8; 32] = hex::decode(
            reqwest::get(base_url.clone() + ".sha256").await?.bytes().await?
        )?.try_into().unwrap();

        if hash != self.hash {
            println!("Updating database...");
            for i in 0..=5 {
                if i == 5 {
                    return Err(anyhow::anyhow!("too many retries"));
                }
                let bytes = reqwest::get(base_url.as_str()).await?.bytes().await?;
                let new_hash: [u8; 32] = Sha256::digest(bytes.as_ref()).into();
                if hash != new_hash {
                    println!("Downloaded data hash does not match, trying again...");
                    continue;
                }
                self.db = self.deserialize_from(bytes.as_ref())?;
                if let Some(cache_file) = self.cache_file.as_ref() {
                    fs::write(cache_file, bytes)?;
                    println!("Written to cache");
                }
                break;
            }
        }

        Ok(())
    }
    pub(crate) async fn init(&mut self, update_check: bool) -> anyhow::Result<()> {
        if let Some(cache_file) = self.cache_file.as_ref() && cache_file.exists() {
            println!("Loading from cache...");
            if let Ok(text) = fs::read(cache_file) && let Ok(db) = self.deserialize_from(text.as_slice()) {
                self.hash = Sha256::digest(text.as_slice()).into();
                self.db = db;
            } else {
                println!("Cache load error");
            }
        } else if !update_check {
            return Err(anyhow::anyhow!("Cache not initialized"))
        }

        if update_check {
            self.check_for_updates().await
        } else {
            Ok(())
        }
    }
}

impl<T: DeserializeOwned> Deref for Database<T> {
    type Target = Vec<T>;
    fn deref(&self) -> &Self::Target {
        &self.db
    }
}

pub struct DatabaseBuilder<T: DeserializeOwned> {
    pub(crate) db: Database<T>,
    pub(crate) run_update_check_on_init: bool,
}

impl DatabaseBuilder<Song> {
    pub fn songs() -> Self {
        Self::custom_type().artifact_name("songs")
    }
}

impl DatabaseBuilder<Artwork> {
    pub fn art() -> Self {
        Self::custom_type().artifact_name("art")
    }
}

impl<T: DeserializeOwned> DatabaseBuilder<T> {
    pub fn custom_type() -> Self {
        Self {
            db: Database {
                db: vec![],
                hash: [0u8; 32],
                url: Url::parse("https://raw.githubusercontent.com/AverseMoon/neurokaraoke-metadata-mirror/main/artifacts/").unwrap(),
                artifact_name: "".to_string(),
                format: DatabaseFormat::Json,
                compression: DatabaseCompressionFormat::Uncompressed,
                cache_file: None,
            },
            run_update_check_on_init: true,
        }
    }

    pub fn json(mut self) -> Self {
        self.db.format = DatabaseFormat::Json;
        self
    }
    pub fn msgpack(mut self) -> Self {
        self.db.format = DatabaseFormat::Msgpack;
        self
    }
    pub fn uncompressed(mut self) -> Self {
        self.db.compression = DatabaseCompressionFormat::Uncompressed;
        self
    }
    pub fn zstd(mut self) -> Self {
        self.db.compression = DatabaseCompressionFormat::Zstd;
        self
    }

    pub fn url(mut self, url: Url) -> Self {
        self.db.url = url;
        self
    }

    pub fn artifact_name(mut self, name: impl Into<String>) -> Self {
        self.db.artifact_name = name.into();
        self
    }

    pub fn cache_file(mut self, path: impl Into<PathBuf>) -> Self {
        self.db.cache_file = Some(path.into());
        self
    }

    pub fn no_cache(mut self) -> Self {
        self.db.cache_file = None;
        self
    }

    pub fn run_update_check_on_init(mut self, flag: bool) -> Self {
        self.run_update_check_on_init = flag;
        self
    }

    pub async fn build(mut self) -> anyhow::Result<Database<T>> {
        self.db.init(self.run_update_check_on_init).await?;
        Ok(self.db)
    }
}
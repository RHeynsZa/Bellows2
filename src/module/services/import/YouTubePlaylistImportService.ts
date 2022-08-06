import { YoutubePlaylistItem } from "../../models/YoutubePlaylistItem";
import { YoutubeIframeApi } from "../../api/YoutubeIframeApi";
import { StreamType } from "../../../types/streaming/streamType";

export class YouTubePlaylistImportService {

    private _player: YT.Player | undefined;

	extractPlaylistKey(playlistString) {
		//YouTube url (any string with a list querystring var)
		//No reliable regex lookbehind for all browsers yet, so we'll just get the first capture group instead
		const urlRegEx = /list=([a-zA-Z0-9_-]+)/
		//Plain playlist key
		const keyRegEx = /^[a-zA-Z0-9_-]+$/

		if (!playlistString || playlistString.length === 0) {
			return;
		}

		const matches = urlRegEx.exec(playlistString);
		if (matches) {
			return matches[1];
		} else {
			return playlistString.match(keyRegEx)[0];
		}
	}

	async getPlaylistInfo(playlistKey): Promise<YoutubePlaylistItem[]> {

		if (!playlistKey) {
			throw new Error("Empty playlist key");
		}

		const api = YoutubeIframeApi.getInstance();

		this._player = await api.createPlaylistPlayer(-1, playlistKey);

        try {
			return await this.scrapeVideoNames();
		} finally {
			api.destroyPlayer(-1, playlistKey);
			this._player = undefined;
		}
	}

	async createFoundryVTTPlaylist(playlistName, trackList, volume): Promise<void> {
		if (!playlistName || Object.prototype.toString.call(playlistName) !== "[object String]") {
			throw new Error("Enter playlist name");
		}

		const playlist = await Playlist.create({
			"name": playlistName,
			"shuffle": false
		});

		const realVolume = AudioHelper.inputToVolume(volume);
		const playlistSounds: Record<string, unknown>[] = [];
		//videos: Arr of {id, title}
		for (let i = 0; i < trackList.length; i++) {
			playlistSounds.push({
				name: trackList[i].title,
				lvolume: volume,
				volume: realVolume,
				path: "streamed.mp3",
				repeat: false,
				flags: {
					bIsStreamed: true,
					streamingApi: StreamType.youtube,
					streamingId: trackList[i].id
				}
			});
		}
        // @ts-ignore
        await playlist?.createEmbeddedDocuments("PlaylistSound", playlistSounds);
	}

    async scrapeVideoNames(): Promise<YoutubePlaylistItem[]> {
        const scrapedTracks: YoutubePlaylistItem[] = [];
        const playlist = this._player?.getPlaylist(); // return array of ids
        if (!playlist) {
			throw new Error("Invalid Playlist");
		}

        let title = "";
        const callBackFunc = (e) => {
            //@ts-ignore -- missing from yt types
            const loadedTitle = e.target.getVideoData().title;
            if (loadedTitle) {
                title = loadedTitle;
            }
        };
        this._player?.addEventListener("onStateChange", callBackFunc);

        const option = '2';
        for (let i = 0; i < playlist.length; i++) {
            console.log(`Scraping ${i}`);
            const id = playlist[i];
            this._player?.playVideoAt(i);
            let timeout = 0;
            // Issue is, we cant remove the event listener, so we cant await, resolve, and add a new listener
            // so we have a few options of how to handle this
            // I chose option 2 since it is faster, but this could probably be improved
            switch (option) {
                // Option 1: We use the onStateChange event to get the title, but since we can't await, we have to use a timeout
                // @ts-ignore
                case '1':
                    await new Promise<void>((resolve) => {
                        // Wait for the title to be loaded
                        setTimeout(() => {
                            resolve();
                        }, 1000);
                    }).then(() => {
                        if (title) {
                            scrapedTracks.push({
                                id,
                                title
                            });
                            console.log(`Scraped ${i}: ${title}`);
                        } else {
                            console.log(`Scraped ${i}: Could not find title in 1 second, skipping`);
                        }
                        title = "";
                    }).catch((err) => {
                        console.log(err);
                    });
                    break;
                case '2':
                    // Option 2: We just wait for the title to load, with a while loop
                    // And timeout if it takes too long, after 10 seconds
                    while (!title && timeout < 50) {
                        await new Promise<void>((resolve) => {
                            setTimeout(() => {
                                resolve();
                            }, 100);
                        });
                        timeout++;
                    }
                    if (title) {
                        scrapedTracks.push({
                            id,
                            title
                        });
                        console.log(`Scraped ${i}: ${title}`);
                    } else {
                        console.log(`Scraped ${i}: Could not find title in 5 seconds, skipping`);
                    }
                    title = "";
                    break;
            }
		}
        return scrapedTracks;
	}
}

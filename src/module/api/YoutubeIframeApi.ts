import { PlayerError, PlayerState } from "../../types/streaming/youtube";
import Logger from "../helper/Utils";

export class YoutubeIframeApi {
    private static instance: YoutubeIframeApi;

    private playersMap: Map<string, YT.Player>;

    public static async initializeApi() {
        if (YoutubeIframeApi.instance) {
            throw new Error("Cannot initialize YoutubeIframeApi more than once!");
        }

        return new Promise<void>((resolve) => {
            window.onYouTubeIframeAPIReady = function () {
                YoutubeIframeApi.instance = new YoutubeIframeApi();
                Logger.LogDebug("YoutubeIframeApi successfully initialized");
                resolve();
            };

            if (!$("#yt-api-script").length) {
                const tag = document.createElement("script");
                tag.id = "yt-api-script";
                tag.src = "https://www.youtube.com/iframe_api";
                tag.type = "text/javascript";

                const firstScriptTag = document.getElementsByTagName("script")[0];
                firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
                Logger.LogDebug("Downloading YoutubeIframeApi...");
            }
        });
    }

    private constructor() {
        this.playersMap = new Map<string, YT.Player>();
    }

    public static getInstance(): YoutubeIframeApi {
        if (!YoutubeIframeApi.instance) {
            throw new Error("Tried to get YoutubeIframeApi before initialization!");
        }

        return this.instance;
    }

    getPlayer(containerId: number, videoId: string): YT.Player | undefined {
        const playerId = this.getIdString(containerId, videoId);
        return this.playersMap.get(playerId);
    }

    async createPlayer(containerId: number, videoId: string): Promise<YT.Player> {
        const playerId = this.getIdString(containerId, videoId);

        if (this.playersMap.has(playerId)) {
            throw new Error("Player already exists for this audio container!");
        }

        return new Promise<YT.Player>((resolve, reject) => {
            const onPlayerError = function (event: YT.OnErrorEvent) {
                let errorMessage: string;
                const data = event.data as unknown as PlayerError;
                switch (data) {
                    case PlayerError.InvalidParam:
                        errorMessage = "Invalid videoId value.";
                        break;
                    case PlayerError.Html5Error:
                        errorMessage = "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.";
                        break;
                    case PlayerError.VideoNotFound:
                        errorMessage = "Video not found; It may have been deleted or marked as private.";
                        break;
                    case PlayerError.EmbeddingNotAllowed:
                    case PlayerError.EmbeddingNotAllowed2:
                        errorMessage = "Embedding is not supported for this video.";
                        break;
                    default:
                        errorMessage = "Unspecified Error";
                }

                reject(errorMessage);
            };

            const onPlayerReadyCallback = function () {
                this.playersMap.set(playerId, player);
                //This class only handles initial errors before onReady. Container's responsibility to deal with these after.
                player.removeEventListener("onError", onPlayerError);
                resolve(player);
            };

            $("body").append(`<div style="position: absolute;
                                width:0;
                                height:0;
                                border:0;
                                display: none;" id="${playerId}"></div>`);

            const player: YT.Player = new YT.Player(playerId, {
                height: "270px",
                width: "480px",
                videoId: videoId,
                playerVars: {
                    loop: 1, //we set this to 1 to prevent iframe reloading when loop is changed
                    playlist: videoId,
                    controls: 0,
                    autohide: 1,
                    origin: window.location.origin,
                },
                events: {
                    "onReady": onPlayerReadyCallback.bind(this),
                    "onError": onPlayerError.bind(this)
                }
            });
        });
    }

    async createPlaylistPlayer(containerId: number, playlistId: string) {
        const playerId = this.getIdString(containerId, playlistId);

        if (this.playersMap.has(playerId)) {
            throw new Error("Player already exists for this audio container!");
        }

        return new Promise<YT.Player>((resolve, reject) => {
            const onPlayerError = function (event: YT.OnErrorEvent) {
                let errorMessage: string;
                const data = event.data as unknown as PlayerError;
                switch (data) {
                    case PlayerError.InvalidParam:
                        errorMessage = "Invalid videoId value.";
                        break;
                    case PlayerError.Html5Error:
                        errorMessage = "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.";
                        break;
                    case PlayerError.VideoNotFound:
                        errorMessage = "Video not found; It may have been deleted or marked as private.";
                        break;
                    case PlayerError.EmbeddingNotAllowed:
                    case PlayerError.EmbeddingNotAllowed2:
                        errorMessage = "Embedding is not supported for this video.";
                        break;
                    default:
                        errorMessage = "Unspecified Error";
                }

                reject(errorMessage);
            };

            const onPlayerReadyCallback = function () {
                this.playersMap.set(playerId, player);
                //This class only handles initial errors before onReady. Container's responsibility to deal with these after.
                player.removeEventListener("onError", onPlayerError);
                resolve(player);
            };

            $("body").append(`<div style="position: absolute;
                                width:0;
                                height:0;
                                border:0;
                                display: none;" id="${playerId}"></div>`);

            //@ts-ignore missing yt types
            const player: YT.Player = new YT.Player(playerId, {
                height: "270px",
                width: "480px",
                playerVars: {
                    listType: "playlist",
                    list: playlistId,
                    controls: 0,
                    autohide: 1,
                    origin: window.location.origin,
                },
                events: {
                    "onReady": onPlayerReadyCallback.bind(this),
                    "onError": onPlayerError.bind(this)
                }
            });
        });
    }

    async destroyPlayer(containerId: number, videoId: string) {
        const playerId = this.getIdString(containerId, videoId);

        const player = this.playersMap.get(playerId);
        if (!player) {
            throw new Error("Player does not exist!");
        }

        if (player.getPlayerState() as unknown as PlayerState === PlayerState.PLAYING) {
            player.stopVideo();
        }

        this.playersMap.delete(playerId);
        player.destroy();

        $(`div#${playerId}`).remove();
    }

    private getIdString(containerId: number, videoId: string) {
        return `bellows-yt-iframe-${containerId}-${videoId}`;
    }
}

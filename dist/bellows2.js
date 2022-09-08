/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/module/helper/Utils.ts
class Logger {
    Log(...args) {
        console.log("Bellows |", ...args);
    }
    LogDebug(...args) {
        console.debug("Bellows DBG |", ...args);
    }
    LogError(...args) {
        console.error("Bellows ERR |", ...args);
    }
}
/* harmony default export */ const Utils = (new Logger());

;// CONCATENATED MODULE: ./src/module/api/YoutubeIframeApi.ts

class YoutubeIframeApi {
    constructor() {
        this.playersMap = new Map();
    }
    static async initializeApi() {
        if (YoutubeIframeApi.instance) {
            throw new Error("Cannot initialize YoutubeIframeApi more than once!");
        }
        return new Promise((resolve) => {
            var _a;
            window.onYouTubeIframeAPIReady = function () {
                YoutubeIframeApi.instance = new YoutubeIframeApi();
                Utils.LogDebug("YoutubeIframeApi successfully initialized");
                resolve();
            };
            if (!$("#yt-api-script").length) {
                const tag = document.createElement("script");
                tag.id = "yt-api-script";
                tag.src = `${window.location.protocol}//www.youtube.com/iframe_api`;
                tag.type = "text/javascript";
                const firstScriptTag = document.getElementsByTagName("script")[0];
                (_a = firstScriptTag.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(tag, firstScriptTag);
                Utils.LogDebug("Downloading YoutubeIframeApi...");
            }
        });
    }
    static getInstance() {
        if (!YoutubeIframeApi.instance) {
            throw new Error("Tried to get YoutubeIframeApi before initialization!");
        }
        return this.instance;
    }
    getPlayer(containerId, videoId) {
        const playerId = this.getIdString(containerId, videoId);
        return this.playersMap.get(playerId);
    }
    async createPlayer(containerId, videoId) {
        const playerId = this.getIdString(containerId, videoId);
        if (this.playersMap.has(playerId)) {
            throw new Error("Player already exists for this audio container!");
        }
        return new Promise((resolve, reject) => {
            const onPlayerError = function (event) {
                let errorMessage;
                const data = Number(event.data);
                switch (data) {
                    case 2 /* PlayerError.InvalidParam */:
                        errorMessage = "Invalid videoId value.";
                        break;
                    case 5 /* PlayerError.Html5Error */:
                        errorMessage = "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.";
                        break;
                    case 100 /* PlayerError.VideoNotFound */:
                        errorMessage = "Video not found; It may have been deleted or marked as private.";
                        break;
                    case 101 /* PlayerError.EmbeddingNotAllowed */:
                    case 150 /* PlayerError.EmbeddingNotAllowed2 */:
                        errorMessage = "Embedding is not supported for this video.";
                        break;
                    default:
                        errorMessage = "Unspecified Error";
                }
                console.error(`Error creating Youtube player: ${errorMessage}`);
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
            const player = new YT.Player(playerId, {
                videoId: videoId,
                playerVars: {
                    loop: 1,
                    playlist: videoId,
                    controls: 0,
                    disablekb: 1,
                    enablejsapi: 1,
                    origin: window.location.origin,
                },
                events: {
                    "onReady": onPlayerReadyCallback.bind(this),
                    "onError": onPlayerError.bind(this)
                }
            });
        });
    }
    async createPlaylistPlayer(containerId, playlistId) {
        const playerId = this.getIdString(containerId, playlistId);
        if (this.playersMap.has(playerId)) {
            throw new Error("Player already exists for this audio container!");
        }
        return new Promise((resolve, reject) => {
            const onPlayerError = function (event) {
                let errorMessage;
                const data = event.data;
                switch (data) {
                    case 2 /* PlayerError.InvalidParam */:
                        errorMessage = "Invalid videoId value.";
                        break;
                    case 5 /* PlayerError.Html5Error */:
                        errorMessage = "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.";
                        break;
                    case 100 /* PlayerError.VideoNotFound */:
                        errorMessage = "Video not found; It may have been deleted or marked as private.";
                        break;
                    case 101 /* PlayerError.EmbeddingNotAllowed */:
                    case 150 /* PlayerError.EmbeddingNotAllowed2 */:
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
            const player = new YT.Player(playerId, {
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
    async destroyPlayer(containerId, videoId) {
        const playerId = this.getIdString(containerId, videoId);
        const player = this.playersMap.get(playerId);
        if (!player) {
            throw new Error("Player does not exist!");
        }
        if (player.getPlayerState() === 1 /* PlayerState.PLAYING */) {
            player.stopVideo();
        }
        this.playersMap.delete(playerId);
        player.destroy();
        $(`div#${playerId}`).remove();
    }
    getIdString(containerId, videoId) {
        return `bellows-yt-iframe-${containerId}-${videoId}`;
    }
}

;// CONCATENATED MODULE: ./src/types/streaming/streamType.ts
var StreamType;
(function (StreamType) {
    StreamType["undefined"] = "";
    StreamType["youtube"] = "youtube";
})(StreamType || (StreamType = {}));

;// CONCATENATED MODULE: ./src/module/services/import/YouTubePlaylistImportService.ts


class YouTubePlaylistImportService {
    extractPlaylistKey(playlistString) {
        //YouTube url (any string with a list querystring var)
        //No reliable regex lookbehind for all browsers yet, so we'll just get the first capture group instead
        const urlRegEx = /list=([a-zA-Z0-9_-]+)/;
        //Plain playlist key
        const keyRegEx = /^[a-zA-Z0-9_-]+$/;
        if (!playlistString || playlistString.length === 0) {
            return;
        }
        const matches = urlRegEx.exec(playlistString);
        if (matches) {
            return matches[1];
        }
        else {
            return playlistString.match(keyRegEx)[0];
        }
    }
    async getPlaylistInfo(playlistKey) {
        if (!playlistKey) {
            throw new Error("Empty playlist key");
        }
        const api = YoutubeIframeApi.getInstance();
        this._player = await api.createPlaylistPlayer(-1, playlistKey);
        try {
            return await this.scrapeVideoNames();
        }
        finally {
            api.destroyPlayer(-1, playlistKey);
            this._player = undefined;
        }
    }
    async createFoundryVTTPlaylist(playlistName, trackList, volume) {
        if (!playlistName || Object.prototype.toString.call(playlistName) !== "[object String]") {
            throw new Error("Enter playlist name");
        }
        const playlist = await Playlist.create({
            "name": playlistName,
            "shuffle": false
        });
        const realVolume = AudioHelper.inputToVolume(volume);
        const playlistSounds = [];
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
        await (playlist === null || playlist === void 0 ? void 0 : playlist.createEmbeddedDocuments("PlaylistSound", playlistSounds));
    }
    async scrapeVideoNames() {
        var _a, _b, _c;
        const scrapedTracks = [];
        const playlist = (_a = this._player) === null || _a === void 0 ? void 0 : _a.getPlaylist(); // return array of ids
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
        (_b = this._player) === null || _b === void 0 ? void 0 : _b.addEventListener("onStateChange", callBackFunc);
        const option = '2';
        for (let i = 0; i < playlist.length; i++) {
            console.log(`Scraping ${i}`);
            const id = playlist[i];
            (_c = this._player) === null || _c === void 0 ? void 0 : _c.playVideoAt(i);
            let timeout = 0;
            // Issue is, we cant remove the event listener, so we cant await, resolve, and add a new listener
            // so we have a few options of how to handle this
            // I chose option 2 since it is faster, but this could probably be improved
            switch (option) {
                // Option 1: We use the onStateChange event to get the title, but since we can't await, we have to use a timeout
                // @ts-ignore
                case '1':
                    await new Promise((resolve) => {
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
                        }
                        else {
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
                        await new Promise((resolve) => {
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
                    }
                    else {
                        console.log(`Scraped ${i}: Could not find title in 5 seconds, skipping`);
                    }
                    title = "";
                    break;
            }
        }
        return scrapedTracks;
    }
}

;// CONCATENATED MODULE: ./src/module/applications/YoutubePlaylistImportForm.ts


class YoutubePlaylistImportForm extends FormApplication {
    constructor(object, options) {
        options.height = "auto";
        super(object, options);
        this.isWorking = false;
        this._playlistItems = [];
        this._playlistTitle = "";
        this._youtubePlaylistImportService = new YouTubePlaylistImportService();
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            title: game.i18n.localize("Bellows.ImportPlaylist.Title"),
            template: "/modules/bellows2/templates/apps/import-youtube-playlist.hbs"
        });
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find("button[id='bellows-yt-import-btn-import']").on("click", (e) => this._onImport.call(this, e));
    }
    getData() {
        return {
            working: this.isWorking,
            playlistTitle: this._playlistTitle,
            playlistItems: this._playlistItems
        };
    }
    async importPlaylist(playlistStr) {
        var _a, _b, _c;
        const key = this._youtubePlaylistImportService.extractPlaylistKey(playlistStr);
        if (!key) {
            (_a = ui.notifications) === null || _a === void 0 ? void 0 : _a.error(game.i18n.localize("Bellows.ImportPlaylist.Messages.InvalidKey"));
            return;
        }
        try {
            this._playlistItems = await this._youtubePlaylistImportService.getPlaylistInfo(key);
            this._playlistTitle = this._playlistItems[0].title;
        }
        catch (ex) {
            if (ex == "Invalid Playlist") {
                (_b = ui.notifications) === null || _b === void 0 ? void 0 : _b.error(game.i18n.format("Bellows.ImportPlaylist.Messages.KeyNotFound", { playlistKey: key }));
            }
            else {
                (_c = ui.notifications) === null || _c === void 0 ? void 0 : _c.error(game.i18n.localize("Bellows.ImportPlaylist.Messages.Error"));
                Utils.LogError(ex);
            }
        }
    }
    async _onImport(e) {
        var _a;
        if (this.isWorking) {
            (_a = ui.notifications) === null || _a === void 0 ? void 0 : _a.error(game.i18n.localize("Bellows.ImportPlaylist.Messages.AlreadyWorking"));
            return;
        }
        this.isWorking = true;
        this._playlistItems = [];
        const button = $(e.currentTarget);
        const playlistUri = button.siblings("input[id='bellows-yt-import-url-text").val();
        await this.rerender();
        await this.importPlaylist(playlistUri);
        this.isWorking = false;
        await this.rerender();
    }
    async rerender() {
        await this._render(false);
        this.setPosition();
    }
    async _updateObject(_e, formData) {
        var _a, _b;
        try {
            await this._youtubePlaylistImportService.createFoundryVTTPlaylist(formData.playlistname, this._playlistItems, formData.playlistvolume);
            (_a = ui.notifications) === null || _a === void 0 ? void 0 : _a.info(game.i18n.format("Bellows.ImportPlaylist.Messages.ImportComplete", { playlistName: formData.playlistname }));
        }
        catch (ex) {
            Utils.LogError(ex);
            (_b = ui.notifications) === null || _b === void 0 ? void 0 : _b.error(game.i18n.localize("Bellows.ImportPlaylist.Messages.Error"));
        }
    }
}

;// CONCATENATED MODULE: ./src/module/features/YoutubeFeature.ts



class YoutubeApiFeature {
    static hooks() {
        Hooks.once("init", async () => {
            Utils.LogDebug("Initializing YoutubeApi Feature");
            await YoutubeIframeApi.initializeApi();
        });
        Hooks.on("renderPlaylistDirectory", (_app, html) => {
            var _a;
            if (!((_a = game.user) === null || _a === void 0 ? void 0 : _a.isGM)) {
                return;
            }
            const importButton = $(`
                <button class="import-yt-playlist">
                    <i class="fas fa-cloud-download-alt"></i> ${game.i18n.localize('Bellows.ImportPlaylist.Title')}
                </button>`);
            html.find(".directory-footer").append(importButton);
            importButton.on("click", () => {
                new YoutubePlaylistImportForm({}, {}).render(true);
            });
        });
    }
}

;// CONCATENATED MODULE: ./src/module/helper/TemplatePreloader.ts
class TemplatePreloader {
    /**
     * Preload a set of templates to compile and cache them for fast access during rendering
     */
    static async preloadHandlebarsTemplates() {
        const templatePaths = [];
        return loadTemplates(templatePaths);
    }
}

;// CONCATENATED MODULE: ./src/module/helper/Settings.ts
class BellowsSettings {
    static registerSettings() {
        /*game.settings.register("bellows", "enableLegacyYoutubeImport", {
            name: game.i18n.localize("Bellows.Settings.LegacyImport.Name"),
            hint: game.i18n.localize("Bellows.Settings.LegacyImport.Hint"),
            scope: "world",
            type: Boolean,
            default: false
        });*/
    }
}

;// CONCATENATED MODULE: ./src/module/services/streaming/YoutubeStreamIdExtractor.ts
class YoutubeStreamIdExtractor {
    extract(uri) {
        /**
         * Url regex string credit https://stackoverflow.com/questions/3717115/regular-expression-for-youtube-links
         * should work for any given youtube link
         */
        const urlRegEx = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-_]*)(&(amp;)[\w=]*)?/;
        //Plain video key
        const keyRegEx = /^[a-zA-Z0-9_-]+$/;
        if (!uri || uri.length === 0) {
            throw new Error("Cannot extract an empty URI");
        }
        const matches = urlRegEx.exec(uri);
        if (matches) {
            return matches[1];
        }
        else {
            const match = uri.match(keyRegEx);
            if (match) {
                return match[0];
            }
            else {
                throw new Error("Invalid video Id");
            }
        }
    }
}

;// CONCATENATED MODULE: ./src/module/factories/StreamIdExtractorFactory.ts


class StreamIdExtractorFactory {
    static getStreamIdExtractor(api) {
        switch (api) {
            case StreamType.youtube:
                return new YoutubeStreamIdExtractor();
            default:
                throw new Error("No extractor is registered for given StreamType");
        }
    }
}

;// CONCATENATED MODULE: ./src/module/integration/YoutubeStreamSound.ts


class YoutubeStreamSound {
    constructor(src, preload = false) {
        this.loaded = false;
        this._loop = false;
        this._scheduledEvents = new Set();
        this._eventHandlerId = 1;
        this._volume = 0;
        this.events = { stop: {}, start: {}, end: {}, pause: {}, load: {}, };
        this.src = src;
        //@ts-ignore -- missing static var from community types, safe to ignore.
        this.id = ++Sound._nodeId;
        //ambient sounds need 'preloaded' sounds as they don't call .load.
        //TODO: preload players in the background for a scene to enable instant playback
        this.loaded = preload;
    }
    //foundry volume is between 0 & 1, YT player volume is between 0 and 100
    get volume() {
        if (this._player) {
            return this._player.getVolume() / 100;
        }
        return this._volume;
    }
    set volume(volume) {
        if (this._player) {
            this._player.setVolume(volume * 100);
        }
        this._volume = volume;
    }
    get currentTime() {
        if (!this._player) {
            return undefined;
        }
        if (this.pausedTime) {
            return this.pausedTime;
        }
        return this._player.getCurrentTime();
    }
    get duration() {
        var _a, _b;
        if (!this._player) {
            return 0;
        }
        return (_b = (_a = this._player) === null || _a === void 0 ? void 0 : _a.getDuration()) !== null && _b !== void 0 ? _b : 0;
    }
    get playing() {
        var _a, _b;
        return ((_b = ((_a = this._player) === null || _a === void 0 ? void 0 : _a.getPlayerState()) == 1 /* PlayerState.PLAYING */) !== null && _b !== void 0 ? _b : false);
    }
    get loop() {
        return this._loop;
    }
    set loop(looping) {
        this._loop = looping;
        if (!this._player)
            return;
        this._player.setLoop(looping);
    }
    //currently don't support type - uses sin easing function
    async fade(volume, { duration = 1000, from }) {
        if (!this._player)
            return;
        //Current only support linear fade
        const currentVolume = from !== null && from !== void 0 ? from : this._player.getVolume();
        const delta = volume - currentVolume;
        if (delta == 0) {
            return Promise.resolve();
        }
        //clear existing handler
        if (this._fadeIntervalHandler) {
            clearInterval(this._fadeIntervalHandler);
        }
        const tickrate = 100;
        const ticks = Math.floor(duration / tickrate);
        let tick = 1;
        return new Promise(resolve => {
            this._fadeIntervalHandler = window.setInterval(() => {
                var _a;
                (_a = this._player) === null || _a === void 0 ? void 0 : _a.setVolume(currentVolume + (this._sinEasing(tick / ticks) * delta));
                if (++tick === ticks + 1) {
                    clearInterval(this._fadeIntervalHandler);
                    this._fadeIntervalHandler = undefined;
                    resolve();
                }
            }, tickrate);
        });
    }
    async load({ autoplay = false, autoplayOptions = {} } = {}) {
        // Foundry delayed loading - await user gesture
        if (game.audio.locked) {
            Utils.LogDebug(`Delaying load of youtube stream sound ${this.src} until after first user gesture`);
            //@ts-ignore -- types incorrectly define pending as an Array<Howl> - just an array of functions...
            await new Promise(resolve => game.audio.pending.push(resolve));
        }
        this.loaded = true;
        // Trigger automatic playback actions
        if (autoplay)
            this.play(autoplayOptions);
        return new Promise(resolve => { resolve(this); });
    }
    async play({ loop = false, offset, volume, fade = 0 } = {}) {
        var _a, _b, _c;
        // If we are still awaiting the first user interaction, add this playback to a pending queue
        if (game.audio.locked) {
            Utils.LogDebug(`Delaying playback of youtube stream sound ${this.src} until after first user gesture`);
            //@ts-ignore -- types incorrectly define pending as an Array<Howl> - just an array of functions...
            return game.audio.pending.push(() => this.play({ loop, offset, volume, fade }));
        }
        if (this.loading instanceof Promise) {
            await this.loading;
        }
        // Lets just wait to make sure the player is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        //Grab player
        if (!this._player) {
            this.loading = YoutubeIframeApi.getInstance().createPlayer(this.id, this.src);
            this.loading.then(player => {
                this._player = player;
            }).catch(reason => {
                Utils.LogError(`Failed to load track ${this.src} - ${reason}`);
            }).finally(() => {
                this.loading = new Promise(resolve => setTimeout(resolve, 1000));
            });
        }
        await this.loading;
        const adjust = () => {
            this.loop = loop;
            if ((volume !== undefined) && (volume !== this.volume)) {
                if (fade)
                    return this.fade(volume, { duration: fade });
                else
                    this.volume = volume;
            }
            return;
        };
        // If the sound is already playing, and a specific offset is not provided, do nothing
        if (this.playing) {
            if (offset === undefined)
                return adjust();
            this.stop();
        }
        // Configure playback
        offset = ((_a = offset !== null && offset !== void 0 ? offset : this.pausedTime) !== null && _a !== void 0 ? _a : 0);
        this.startTime = this.currentTime;
        this.pausedTime = undefined;
        // Start playback
        this.volume = 0; // Start volume at 0
        (_b = this._player) === null || _b === void 0 ? void 0 : _b.seekTo(offset, true);
        (_c = this._player) === null || _c === void 0 ? void 0 : _c.addEventListener('onStateChange', this._onEnd.bind(this));
        adjust(); // Adjust to the desired volume
        this._onStart();
    }
    pause() {
        var _a;
        this.pausedTime = this.currentTime;
        this.startTime = undefined;
        (_a = this._player) === null || _a === void 0 ? void 0 : _a.pauseVideo();
        this._onPause();
    }
    stop() {
        var _a;
        if (this.playing === false)
            return;
        this.pausedTime = undefined;
        this.startTime = undefined;
        (_a = this._player) === null || _a === void 0 ? void 0 : _a.stopVideo();
        YoutubeIframeApi.getInstance().destroyPlayer(this.id, this.src).then(() => {
            this._player = undefined;
            this._onStop();
        });
    }
    /* eslint-disable */
    schedule(fn, playbackTime) {
        var _a;
        /* eslint-enable */
        const now = (_a = this.currentTime) !== null && _a !== void 0 ? _a : 0;
        playbackTime = Math.clamped(playbackTime, 0, this.duration);
        if (playbackTime < now)
            playbackTime += this.duration;
        const deltaMS = (playbackTime - now) * 1000;
        return new Promise(resolve => {
            const timeoutId = setTimeout(() => {
                this._scheduledEvents.delete(timeoutId);
                fn(this);
                return resolve();
            }, deltaMS);
            this._scheduledEvents.add(timeoutId);
        });
    }
    emit(eventName) {
        const events = this.events[eventName];
        if (!events)
            return;
        for (const [fnId, callback] of Object.entries(events)) {
            //@ts-ignore -- typings stuff. Safe to ignore.
            callback.fn(this);
            //@ts-ignore
            if (callback.once)
                delete events[fnId];
        }
    }
    /* eslint-disable */
    off(eventName, fn) {
        /* eslint-enable */
        const events = this.events[eventName];
        if (!events)
            return;
        if (Number.isNumeric(fn))
            delete events[fn];
        for (const [id, f] of Object.entries(events)) {
            if (f === fn) {
                delete events[id];
                break;
            }
        }
    }
    /* eslint-disable */
    on(eventName, fn, { once = false } = {}) {
        /* eslint-enable */
        return this._registerForEvent(eventName, { fn, once });
    }
    /* eslint-disable */
    _registerForEvent(eventName, callback) {
        /* eslint-enable */
        const events = this.events[eventName];
        if (!events)
            return;
        const fnId = this._eventHandlerId++;
        events[fnId] = callback;
        return fnId;
    }
    _sinEasing(x) {
        return 1 - Math.cos((x * Math.PI) / 2);
    }
    /* -------------------------------------------- */
    _clearEvents() {
        for (const timeoutId of this._scheduledEvents) {
            window.clearTimeout(timeoutId);
        }
        this._scheduledEvents.clear();
    }
    _onEnd(e) {
        if (e.data == 0 /* PlayerState.ENDED */) {
            if (!this.loop) {
                this._clearEvents();
                //@ts-ignore
                game.audio.playing.delete(this.id);
                YoutubeIframeApi.getInstance().destroyPlayer(this.id, this.src).then(() => {
                    this._player = undefined;
                });
                this.emit("end");
            }
        }
    }
    _onLoad() {
        this.emit("load");
    }
    _onPause() {
        this._clearEvents();
        this.emit("pause");
    }
    _onStart() {
        //@ts-ignore
        game.audio.playing.set(this.id, this);
        this.emit("start");
    }
    _onStop() {
        this._clearEvents();
        //@ts-ignore
        game.audio.playing.delete(this.id);
        this.emit("stop");
    }
}

;// CONCATENATED MODULE: ./src/module/factories/StreamSoundFactory.ts


class StreamSoundFactory {
    static getStreamSound(api, src, preload = false) {
        switch (api) {
            case StreamType.youtube:
                return new YoutubeStreamSound(src, preload);
            default:
                throw new Error("No Stream Sound is registered for given StreamType");
        }
    }
}

;// CONCATENATED MODULE: ./src/module/patches/AmbientSoundPatch.ts




class AmbientSoundPatch {
    static patch() {
        const createSoundFunction = AmbientSound.prototype._createSound;
        AmbientSound.prototype._createSound = function () {
            if (!hasProperty(this, "data.flags.bIsStreamed") || !this.data.flags.bIsStreamed) {
                return createSoundFunction.apply(this);
            }
            const sound = StreamSoundFactory.getStreamSound(this.data.flags.streamingApi, this.data.flags.streamingId, true);
            return sound;
        };
        //Protected function - get around that by ignoring typescript errors.
        // @ts-ignore
        const updateObjectFunction = AmbientSoundConfig.prototype._updateObject;
        // @ts-ignore
        AmbientSoundConfig.prototype._updateObject = function (event, formData) {
            var _a;
            if (!((_a = game.user) === null || _a === void 0 ? void 0 : _a.isGM))
                throw new Error("You do not have the ability to configure a AmbientSound object.");
            if (!formData.streamed) {
                updateObjectFunction.apply(this, [event, formData]);
                return;
            }
            const streamType = StreamType[formData.streamtype];
            const extractor = StreamIdExtractorFactory.getStreamIdExtractor(streamType);
            let streamId;
            try {
                streamId = extractor.extract(formData.streamurl);
            }
            catch (ex) {
                Utils.LogError(ex);
                throw new Error(game.i18n.localize("Bellows.PlaylistConfig.Errors.InvalidUri"));
            }
            formData.path = `${streamId}.mp3`;
            formData.flags = {
                bIsStreamed: formData.streamed,
                streamingApi: streamType,
                streamingId: streamId,
            };
            if (this.object.id)
                return this.object.update(formData);
            return this.object.constructor.create(formData, { parent: this.object.parent });
        };
        Hooks.on('renderAmbientSoundConfig', (sender, html, data) => {
            //TODO: Hacky and fragile. Rewrite
            const bIsStreamed = (data.data.flags || {}).bIsStreamed || false;
            //const streamType = (data.flags || {}).streamingApi || "";
            const streamId = (data.data.flags || {}).streamingId || "";
            const audioUrlDiv = $(html).find("div.form-fields input[name='path']").parent().parent();
            audioUrlDiv.before(`
            <div class="form-group">
                <label>${game.i18n.localize("Bellows.PlaylistConfig.Labels.Streamed")}</label>
                <input type="checkbox" name="streamed" data-dtype="Boolean" ${bIsStreamed ? "checked" : ""} />
            </div>`);
            audioUrlDiv.after(`
            <div class="form-group">
                <label>
                    ${game.i18n.localize("Bellows.PlaylistConfig.Labels.AudioUrl")}
                </label>
                <input type="text" name="streamurl" data-dtype="Url" value="${streamId}" />
            </div>
            `);
            audioUrlDiv.after(`
            <div class="form-group">
                <label>
                    ${game.i18n.localize("Bellows.PlaylistConfig.Labels.StreamType")}
                </label>
                <select name="streamtype">
                    <option value="youtube" selected>${game.i18n.localize("Bellows.PlaylistConfig.Selects.StreamTypes.Youtube")}</option>
                </select>
            </div>
            `);
            const inputIsStreamed = $(html).find("input[name='streamed']");
            const inputStreamUrl = $(html).find("input[name='streamurl']");
            const selectStreamType = $(html).find("select[name='streamtype']");
            const adjustVisibility = (isStream) => {
                audioUrlDiv.css('display', !isStream ? "flex" : "none");
                inputStreamUrl.parent().css("display", isStream ? "flex" : "none");
                selectStreamType.parent().css("display", isStream ? "flex" : "none");
            };
            inputIsStreamed.on('change', evt => {
                const chkEvent = evt;
                adjustVisibility(chkEvent.target.checked);
                sender.setPosition();
            });
            adjustVisibility(bIsStreamed);
            sender.options.height = 'auto';
            sender.setPosition();
        });
    }
}

;// CONCATENATED MODULE: ./src/module/patches/PlaylistSoundPatch.ts




class PlaylistSoundPatch {
    static patch() {
        const createSoundFunction = PlaylistSound.prototype._createSound;
        PlaylistSound.prototype._createSound = function () {
            if (!hasProperty(this, "data.flags.bIsStreamed") || !this.data.flags.bIsStreamed) {
                return createSoundFunction.apply(this);
            }
            const sound = StreamSoundFactory.getStreamSound(this.data.flags.streamingApi, this.data.flags.streamingId);
            sound.on("start", this._onStart.bind(this));
            sound.on("end", this._onEnd.bind(this));
            sound.on("stop", this._onStop.bind(this));
            return sound;
        };
        //Protected function - get around that by ignoring typescript errors.
        // @ts-ignore
        const updateObjectFunction = PlaylistSoundConfig.prototype._updateObject;
        // @ts-ignore
        PlaylistSoundConfig.prototype._updateObject = function (event, formData) {
            var _a;
            if (!((_a = game.user) === null || _a === void 0 ? void 0 : _a.isGM))
                throw new Error("You do not have the ability to configure a PlaylistSound object.");
            if (!formData.streamed) {
                updateObjectFunction.apply(this, [event, formData]);
                return;
            }
            const streamType = StreamType[formData.streamtype];
            const extractor = StreamIdExtractorFactory.getStreamIdExtractor(streamType);
            let streamId;
            try {
                streamId = extractor.extract(formData.streamurl);
            }
            catch (ex) {
                Utils.LogError(ex);
                throw new Error(game.i18n.localize("Bellows.PlaylistConfig.Errors.InvalidUri"));
            }
            formData["volume"] = AudioHelper.inputToVolume(formData["lvolume"]);
            formData.path = `${streamId}.mp3`;
            formData.flags = {
                bIsStreamed: formData.streamed,
                streamingApi: streamType,
                streamingId: streamId,
            };
            if (this.object.id)
                return this.object.update(formData);
            return this.object.constructor.create(formData, { parent: this.object.parent });
        };
        Hooks.on("renderPlaylistSoundConfig", (sender, html, data) => {
            //TODO: Hacky and fragile. Rewrite
            const bIsStreamed = (data.data.flags || {}).bIsStreamed || false;
            //const streamType = (data.flags || {}).streamingApi || "";
            const streamId = (data.data.flags || {}).streamingId || "";
            const audioUrlDiv = $(html).find("div.form-fields input[name='path']").parent().parent();
            audioUrlDiv.before(`
            <div class="form-group">
                <label>${game.i18n.localize("Bellows.PlaylistConfig.Labels.Streamed")}</label>
                <input type="checkbox" name="streamed" data-dtype="Boolean" ${bIsStreamed ? "checked" : ""} />
            </div>`);
            audioUrlDiv.after(`
            <div class="form-group">
                <label>
                    ${game.i18n.localize("Bellows.PlaylistConfig.Labels.AudioUrl")}
                </label>
                <input type="text" name="streamurl" data-dtype="Url" value="${streamId}" />
            </div>
            `);
            audioUrlDiv.after(`
            <div class="form-group">
                <label>
                    ${game.i18n.localize("Bellows.PlaylistConfig.Labels.StreamType")}
                </label>
                <select name="streamtype">
                    <option value="youtube" selected>${game.i18n.localize("Bellows.PlaylistConfig.Selects.StreamTypes.Youtube")}</option>
                </select>
            </div>
            `);
            const inputIsStreamed = $(html).find("input[name='streamed']");
            const inputStreamUrl = $(html).find("input[name='streamurl']");
            const selectStreamType = $(html).find("select[name='streamtype']");
            const adjustVisibility = (isStream) => {
                audioUrlDiv.css('display', !isStream ? "flex" : "none");
                inputStreamUrl.parent().css("display", isStream ? "flex" : "none");
                selectStreamType.parent().css("display", isStream ? "flex" : "none");
            };
            inputIsStreamed.on('change', evt => {
                const chkEvent = evt;
                adjustVisibility(chkEvent.target.checked);
                sender.setPosition();
            });
            adjustVisibility(bIsStreamed);
            sender.options.height = 'auto';
            sender.setPosition();
        });
    }
}

;// CONCATENATED MODULE: ./src/module/helper/Patch.ts


class BellowsPatch {
    static patchFoundryClassFunctions() {
        PlaylistSoundPatch.patch();
        AmbientSoundPatch.patch();
    }
}

;// CONCATENATED MODULE: ./src/bellows2.ts





Hooks.once("init", async () => {
    Utils.Log('Initializing Bellows - The lungs of the Foundry!');
    BellowsSettings.registerSettings();
    BellowsPatch.patchFoundryClassFunctions();
    await TemplatePreloader.preloadHandlebarsTemplates();
});
/*
 * Feature Hooks
 */
YoutubeApiFeature.hooks();
if (false) {}

/******/ })()
;
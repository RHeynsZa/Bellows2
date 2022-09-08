import { PlayerState } from "../../types/streaming/youtube";
import { YoutubeIframeApi } from "../api/YoutubeIframeApi";
import Logger from "../helper/Utils";

export class YoutubeStreamSound implements Sound {

    id: number;
    src: string;
    loaded = false;
    private _player: YT.Player | undefined;
    private _fadeIntervalHandler: number | undefined;
    private _loop = false;
    private _scheduledEvents = new Set<number>();
    private _eventHandlerId = 1;
    private _volume = 0;

    startTime: number | undefined;
    pausedTime: number | undefined;
    events = { stop: {}, start: {}, end: {}, pause: {}, load: {}, };
    loading: Promise<YT.Player> | undefined;
    context: AudioContext | undefined;
    node: AudioBufferSourceNode | MediaElementAudioSourceNode | undefined;
    gain: AudioParam | undefined;

    //foundry volume is between 0 & 1, YT player volume is between 0 and 100
    public get volume(): number {
        if (this._player) {
            return this._player.getVolume() / 100;
        }

        return this._volume;
    }

    public set volume(volume: number) {
        if (this._player) {
            this._player.setVolume(volume * 100);
        }
        this._volume = volume;
    }

    public get currentTime(): number | undefined {
        if (!this._player) {
            return undefined;
        }

        if (this.pausedTime) {
            return this.pausedTime;
        }

        return this._player.getCurrentTime();
    }

    public get duration(): number {
        if (!this._player) {
            return 0;
        }

        return this._player?.getDuration() ?? 0;
    }

    public get playing(): boolean {
        return (this._player?.getPlayerState() as unknown as PlayerState == PlayerState.PLAYING ?? false)
    }

    public get loop() {
        return this._loop;
    }

    public set loop(looping) {
        this._loop = looping;
        if (!this._player) return;
        this._player.setLoop(looping);
    }

    constructor(src: any, preload = false) {
        this.src = src;
        //@ts-ignore -- missing static var from community types, safe to ignore.
        this.id = ++Sound._nodeId;

        //ambient sounds need 'preloaded' sounds as they don't call .load.
        //TODO: preload players in the background for a scene to enable instant playback
        this.loaded = preload;
    }

    //currently don't support type - uses sin easing function
    async fade(volume: number, { duration = 1000, from }: { duration?: number; from?: number; type?: string }): Promise<void> {
        if (!this._player) return;

        //Current only support linear fade
        const currentVolume = from ?? this._player.getVolume();
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
                this._player?.setVolume(currentVolume + (this._sinEasing(tick / ticks) * delta));

                if (++tick === ticks + 1) {
                    clearInterval(this._fadeIntervalHandler);
                    this._fadeIntervalHandler = undefined;
                    resolve();
                }
            }, tickrate)
        });
    }

    async load({ autoplay = false, autoplayOptions = {} } = {}): Promise<Sound> {
        // Foundry delayed loading - await user gesture
        if (game.audio.locked) {
            Logger.LogDebug(`Delaying load of youtube stream sound ${this.src} until after first user gesture`);

            //@ts-ignore -- types incorrectly define pending as an Array<Howl> - just an array of functions...
            await new Promise(resolve => game.audio.pending.push(resolve));
        }

        this.loaded = true;

        // Trigger automatic playback actions
        if (autoplay) this.play(autoplayOptions);

        return new Promise(resolve => { resolve(this); });
    }

    async play({ loop = false, offset, volume, fade = 0 }: { loop?: boolean; offset?: number; volume?: number; fade?: number; } = {}) {
        // If we are still awaiting the first user interaction, add this playback to a pending queue
        if (game.audio.locked) {
            Logger.LogDebug(`Delaying playback of youtube stream sound ${this.src} until after first user gesture`);

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
                Logger.LogError(`Failed to load track ${this.src} - ${reason}`);
            }).finally(() => {
                this.loading = new Promise(resolve => setTimeout(resolve, 1000));
            });
        }

        await this.loading;

        const adjust = () => {
            this.loop = loop;
            if ((volume !== undefined) && (volume !== this.volume)) {
                if (fade) return this.fade(volume, { duration: fade });
                else this.volume = volume;
            }
            return;
        }

        // If the sound is already playing, and a specific offset is not provided, do nothing
        if (this.playing) {
            if (offset === undefined) return adjust();
            this.stop();
        }

        // Configure playback
        offset = (offset ?? this.pausedTime ?? 0);
        this.startTime = this.currentTime;
        this.pausedTime = undefined;

        // Start playback
        this.volume = 0; // Start volume at 0
        this._player?.seekTo(offset, true);

        this._player?.addEventListener<YT.OnStateChangeEvent>('onStateChange', this._onEnd.bind(this));
        adjust(); // Adjust to the desired volume
        this._onStart();
    }

    pause() {
        this.pausedTime = this.currentTime;
        this.startTime = undefined;
        this._player?.pauseVideo();
        this._onPause();
    }

    stop() {
        if (this.playing === false) return;
        this.pausedTime = undefined;
        this.startTime = undefined;
        this._player?.stopVideo();
        YoutubeIframeApi.getInstance().destroyPlayer(this.id, this.src).then(() => {
            this._player = undefined;
            this._onStop();
        });
    }

    /* eslint-disable */
    schedule(fn: Function, playbackTime: number): Promise<void> {
        /* eslint-enable */
        const now = this.currentTime ?? 0;
        playbackTime = Math.clamped(playbackTime, 0, this.duration);
        if (playbackTime < now) playbackTime += this.duration;
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

    emit(eventName: string) {
        const events = this.events[eventName]
        if (!events) return;
        for (const [fnId, callback] of Object.entries(events)) {
            //@ts-ignore -- typings stuff. Safe to ignore.
            callback.fn(this);
            //@ts-ignore
            if (callback.once) delete events[fnId];
        }
    }

    /* eslint-disable */
    off(eventName: string, fn: number | Function) {
        /* eslint-enable */
        const events = this.events[eventName];
        if (!events) return;
        if (Number.isNumeric(fn)) delete events[fn];
        for (const [id, f] of Object.entries(events)) {
            if (f === fn) {
                delete events[id];
                break;
            }
        }
    }
    /* eslint-disable */
    on(eventName: string, fn: Function, { once = false } = {}) {
        /* eslint-enable */
        return this._registerForEvent(eventName, { fn, once });
    }

    /* eslint-disable */
    private _registerForEvent(eventName, callback: { fn: Function, once?: boolean }) {
        /* eslint-enable */
        const events = this.events[eventName];
        if (!events) return;
        const fnId = this._eventHandlerId++;
        events[fnId] = callback;
        return fnId;
    }

    private _sinEasing(x: number) {
        return 1 - Math.cos((x * Math.PI) / 2);
    }

    /* -------------------------------------------- */

    protected _clearEvents() {
        for (const timeoutId of this._scheduledEvents) {
            window.clearTimeout(timeoutId)
        }
        this._scheduledEvents.clear();
    }

    protected _onEnd(e: YT.OnStateChangeEvent) {
        if (e.data as unknown as PlayerState == PlayerState.ENDED) {
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

    protected _onLoad() {
        this.emit("load");
    }

    protected _onPause() {
        this._clearEvents();
        this.emit("pause");
    }

    protected _onStart() {
        //@ts-ignore
        game.audio.playing.set(this.id, this);
        this.emit("start");
    }

    protected _onStop() {
        this._clearEvents();
        //@ts-ignore
        game.audio.playing.delete(this.id);
        this.emit("stop");
    }
}

import { YoutubePlaylistItem } from "../models/YoutubePlaylistItem";
import Logger from "../helper/Utils";
import { YouTubePlaylistImportService } from "../services/import/YouTubePlaylistImportService";

export class YoutubePlaylistImportForm extends FormApplication<any, any, any> {

    isWorking: boolean;
    private _playlistItems: YoutubePlaylistItem[];
    private _playlistTitle: string;
    private _youtubePlaylistImportService: YouTubePlaylistImportService;

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
        } as FormApplication.Options);
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

    private async importPlaylist(playlistStr) {
        const key = this._youtubePlaylistImportService.extractPlaylistKey(playlistStr);

        if (!key) {
            ui.notifications?.error(game.i18n.localize("Bellows.ImportPlaylist.Messages.InvalidKey"));
            return;
        }

        try {
            this._playlistItems = await this._youtubePlaylistImportService.getPlaylistInfo(key);
            this._playlistTitle = this._playlistItems[0].title;
        } catch (ex) {
            if (ex == "Invalid Playlist") {
                ui.notifications?.error(game.i18n.format("Bellows.ImportPlaylist.Messages.KeyNotFound", { playlistKey: key }));
            } else {
                ui.notifications?.error(game.i18n.localize("Bellows.ImportPlaylist.Messages.Error"));
                Logger.LogError(ex);
            }
        }
    }

    async _onImport(e) {
        if (this.isWorking) {
            ui.notifications?.error(game.i18n.localize("Bellows.ImportPlaylist.Messages.AlreadyWorking"));
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

    private async rerender() {
        await this._render(false);
        this.setPosition();
    }

    async _updateObject(_e, formData) {
        try {
            await this._youtubePlaylistImportService.createFoundryVTTPlaylist(formData.playlistname, this._playlistItems, formData.playlistvolume);
            ui.notifications?.info(game.i18n.format("Bellows.ImportPlaylist.Messages.ImportComplete", { playlistName: formData.playlistname }));
        } catch (ex) {
            Logger.LogError(ex);
            ui.notifications?.error(game.i18n.localize("Bellows.ImportPlaylist.Messages.Error"));
        }
    }
}

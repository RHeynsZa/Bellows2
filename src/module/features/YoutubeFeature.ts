import Logger from "../helper/Utils";
import { YoutubeIframeApi } from "../api/YoutubeIframeApi";
import { YoutubePlaylistImportForm } from "../applications/YoutubePlaylistImportForm";

export class YoutubeApiFeature {
    static hooks() {
        Hooks.once("init", async () => {
            Logger.LogDebug("Initializing YoutubeApi Feature");

            await YoutubeIframeApi.initializeApi();
        });

        Hooks.on("renderPlaylistDirectory", (_app, html) => {
            if (!game.user?.isGM) {
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

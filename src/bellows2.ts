import { YoutubeApiFeature } from "./module/features/YoutubeFeature";
import { TemplatePreloader } from "./module/helper/TemplatePreloader";
import { BellowsSettings } from "./module/helper/Settings"
import { BellowsPatch } from "./module/helper/Patch";
import Logger from "./module/helper/Utils";

Hooks.once("init", async () => {
    Logger.Log('Initializing Bellows - The lungs of the Foundry!');

    BellowsSettings.registerSettings();

    BellowsPatch.patchFoundryClassFunctions();

    await TemplatePreloader.preloadHandlebarsTemplates();
});

/* 
 * Feature Hooks
 */

YoutubeApiFeature.hooks();

if (module.hot) {
    module.hot.accept();
    if (module.hot.status() === "apply") {
        for (const template in _templateCache) {
            if (Object.prototype.hasOwnProperty.call(_templateCache, template)) {
                delete _templateCache[template];
            }
        }

        TemplatePreloader.preloadHandlebarsTemplates().then(() => {
            for (const application in ui.windows) {
                if (Object.prototype.hasOwnProperty.call(ui.windows, application)) {
                    ui.windows[application].render(true);
                }
            }
        });
    }
}
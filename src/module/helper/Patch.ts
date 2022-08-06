import { AmbientSoundPatch } from "../patches/AmbientSoundPatch";
import { PlaylistSoundPatch } from "../patches/PlaylistSoundPatch";

export class BellowsPatch {
    static patchFoundryClassFunctions() {
        PlaylistSoundPatch.patch();
        AmbientSoundPatch.patch();
    }
}

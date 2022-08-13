import Emote from "./Emote";

export default class Params {
    src: string;
    name: string;
    optalign: string;
    imgId: string;
    settings: unknown;
    emotes: { [key: string]: Emote };
}
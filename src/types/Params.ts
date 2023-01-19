import { EmoteDictionary } from "../resources/resources_types";
import Emote from "./Emote";
import type EmotionDefinition from "./EmotionDefinition";

export default class Params {
	src: string;
	name: string;
	optalign: string;
	imgId: string;
	settings: EmotionDefinition;
	emotes: { [key: string]: EmotionDefinition };
}

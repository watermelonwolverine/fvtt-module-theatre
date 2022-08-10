import { ActorData as ActorData_ } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import { AnimationRigging, EmoteDictionary } from "./resources/resources_types";

declare global {
	interface LenientGlobalVariableTypes {
		game: never;
		canvas: never;
		ui: never;
		// combat-utility-belt extensions

	}

	interface Game {
		cub?: any;
	}

	interface String {
		/** Localizes the string via the global `game.i18n.localize()` function. */
		localize(): string
	}
	interface HTMLElement {
		currentStyle: CSSStyleDeclaration;
	}

	interface TheatreFlags {
		emotes: EmoteDictionary;
		rigging: AnimationRigging;
	}

	interface ActorFlags extends Record<string, unknown> {
		theatre?: TheatreFlags;
	}

	interface ActorData extends ActorData_ {
		flags: ActorFlags;
	}

	interface Actor {
		data: ActorData;
		name: string;
	}

	namespace PIXI {
		interface Sprite {
			theatreComponentName: string;
		}
	}
}



export default interface Resources extends Partial<Record<string, PIXI.LoaderResource>> { }





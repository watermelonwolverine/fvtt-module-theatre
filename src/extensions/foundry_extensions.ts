import type { ActorData as ActorData_ } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import type { AnimationRigging, EmoteDictionary } from "../resources/resources_types";
import type EmotionDefinition from "../types/EmotionDefinition";

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
		localize(): string;
	}
	interface HTMLElement {
		currentStyle: CSSStyleDeclaration;
	}

	interface TheatreFlags {
		emotes: EmoteDictionary;
		rigging: AnimationRigging;
		baseinsert: string;
		name: string;
		optalign: string;
		settings: EmotionDefinition;
	}

	interface ActorFlags extends Record<string, unknown> {
		theatre?: TheatreFlags;
	}

	interface ActorData extends ActorData_ {
		flags: ActorFlags;
	}

	interface Actor {
		_id: string;
		data: ActorData;
		name: string;
	}

	namespace PIXI {
		interface Sprite {
			theatreComponentName: string;
		}

		interface DisplayObject {
			theatreComponentName: string;
		}
	}
}

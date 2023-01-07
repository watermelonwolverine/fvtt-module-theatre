import type Theatre from "../../Theatre";
import type EmotionDefinition from "../../types/EmotionDefinition";
import type Portrait from "./Portrait";
import Stage from "./Stage";
import StageInsertClearer from "./StageInsertCleaner";

export default class StageInsert {
	/** Id of the image, usually theatre-<actorId> */
	imgId: string;
	// contains label and portraitContainer
	// sits right on top the textBox
	dockContainer?: PIXI.Container;

	name: string;
	emotion: EmotionDefinition;
	portrait: Portrait | null;
	label: PIXI.Text;
	typingBubble: PIXI.Sprite;
	exitOrientation: "left" | "right";
	nameOrientation: "left" | "right";
	optAlign: string;
	tweens: { [key: string]: TweenMax };
	order: number;
	renderOrder: number;
	/** If this dock is in the process of being deleted */
	deleting? = false;
	meta: {};
	mirrored? = false;
	delayedOldEmote?: string;
	decayTOId?: number;
	// given
	theatre: Theatre;

	// workers
	clearer: StageInsertClearer;

	constructor(theatre: Theatre) {
		this.theatre = theatre;

		this.clearer = new StageInsertClearer(theatre);
	}

	clear() {
		this.clearer.clearPortraitContainer(this);
	}
}

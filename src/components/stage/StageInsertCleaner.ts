import type Theatre from "../../Theatre";
import Portrait from "./Portrait";
import type StageInsert from "./StageInsert";

export default class StageInsertClearer {
	theatre: Theatre;

	constructor(theatre: Theatre) {
		this.theatre = theatre;
	}

	/**
	 * Clear the container by ending all animations, and removing all sprites
	 *
	 */
	clearPortraitContainer(insert: StageInsert) {
		// TODO refactor

		if (!insert || !insert.dockContainer || !insert.portrait) {
			return;
		}
		// preserve position without portrait offset
		let ox = insert.portrait.x;
		let oy = insert.portrait.y;
		let ocx = insert.dockContainer.x;
		let ocy = insert.dockContainer.y;
		let oLabelAnim = insert.tweens["nameSpeakingPulse"];
		let oTypingBounceAnim = insert.tweens["typingBounce"];
		let oTypingWiggleAnim = insert.tweens["typingWiggle"];
		let oTypingAppearAnim = insert.tweens["typingAppear"];
		let oTypingVanishAnim = insert.tweens["typingVanish"];
		// kill and release all tweens, except for label or typingBubble
		// animation
		for (let tweenId in insert.tweens) {
			if (
				tweenId == "nameSpeakingPulse" ||
				tweenId == "typingBounce" ||
				tweenId == "typingAppear" ||
				tweenId == "typingVanish" ||
				tweenId == "typingWiggle"
			)
				continue;
			this.theatre._removeDockTween(insert.imgId, null, tweenId);
		}
		insert.tweens = {};
		if (oLabelAnim) {
			insert.tweens["nameSpeakingPulse"] = oLabelAnim;
		}
		if (oTypingBounceAnim) {
			insert.tweens["typingBounce"] = oTypingBounceAnim;
		}
		if (oTypingWiggleAnim) {
			insert.tweens["typingWiggle"] = oTypingWiggleAnim;
		}
		if (oTypingAppearAnim) {
			insert.tweens["typingAppear"] = oTypingAppearAnim;
		}
		if (oTypingVanishAnim) {
			insert.tweens["typingVanish"] = oTypingVanishAnim;
		}
		insert.portrait.destroy();

		// attempt to preserve label + typingBubble
		for (let idx = insert.dockContainer.children.length - 1; idx >= 0; --idx) {
			let child = <any>insert.dockContainer.children[idx];
			if (child.theatreComponentName && child.theatreComponentName == "label") {
				insert.dockContainer.removeChildAt(idx);
			} else if (child.theatreComponentName && child.theatreComponentName == "typingBubble") {
				insert.dockContainer.removeChildAt(idx);
			} else {
				child.destroy();
			}
		}

		insert.portrait = null;
		// destroy self
		insert.dockContainer.destroy();
		insert.dockContainer = undefined;
		// re-generate the container
		const newDockContainer = new PIXI.Container();
		const newPortrait = new Portrait(this.theatre.stage);
		newPortrait.init();
		newDockContainer.addChild(newPortrait.root);
		insert.portrait = newPortrait;
		// initial positioning
		newDockContainer.x = ocx;
		newDockContainer.y = ocy;
		newPortrait.x = ox;
		newPortrait.y = oy;
		// assignment
		insert.dockContainer = newDockContainer;
	}
}

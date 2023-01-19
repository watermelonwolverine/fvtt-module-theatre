/* eslint-disable no-unused-vars */
import type { Animation } from "src/resources/resources_types";
import ActorExtensions from "../extensions/ActorExtensions";
import TheatreSettings from "../extensions/TheatreSettings";
import type Theatre from "../Theatre";
import TheatreStyle from "../types/TheatreStyle";

export default class TheatrePortraitContainerSetupWorker {
	theatre: Theatre;

	constructor(theatre: Theatre) {
		this.theatre = theatre;
	}

	/**
     * Sets up a portrait's PIXI dockContainer to size to
     * the given resource
     * @params imgId (String) : The theatreId of the insert whose portrait we're setting up.
     * @params resName (String) : The resource name of the sprite to configure.
     * @params resources (Object) : The resource object from PIXI.Loader.shared.
     * @params reorder (Boolean) : Boolean to indicate if a reorder should be performed after
    an update.
     * @param {any} imgId
     * @param {string} optAlign
     * @param {string} resName
     * @param {PIXI.IResourceDictionary} resources
     * @param {boolean} [reorder]
     */
	setupPortraitContainer(
		imgId: string,
		optAlign: string, // TODO remove
		resName: string,
		resources: PIXI.IResourceDictionary,
		reorder = false
	): void {
		const stage = this.theatre.stage;
		const insert = stage.getInsertById(imgId);

		if (!insert || !insert.dockContainer) {
			console.error("ERROR PIXI Container was destroyed before setup could execute for %s", imgId);
			ui.notifications.error(
				`${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1")} ${imgId} ${game.i18n.localize(
					"Theatre.UI.Notification.ImageLoadFail_P2"
				)} ${resName}`
			);
			stage.removeInsertById(imgId);
			return;
		}

		if (!resources[resName] || !resources[resName]?.texture) {
			console.error("ERROR could not load texture %s", resName, resources);
			ui.notifications.error(
				`${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1")} ${imgId} ${game.i18n.localize(
					"Theatre.UI.Notification.ImageLoadFail_P2"
				)} ${resName}`
			);
			stage.removeInsertById(imgId);
			return;
		}

		let dockContainer = insert.dockContainer;
		if (!insert.portrait) {
			return;
		}

		insert.portrait.updateTexture(<PIXI.Texture>resources[resName]?.texture);
		insert.portrait.init();

		insert.dockContainer.x = 0;
		insert.dockContainer.y = insert.optAlign == "top" ? 0 : Number(stage.theatreBar?.offsetHeight);

		const portWidth = insert.portrait.width;
		const portHeight = insert.portrait.height;

		insert.label.style.fontWeight = this.theatre.fontWeight;
		insert.label.style.wordWrapWidth = portWidth;

		insert.label.y =
			portHeight -
			(insert.optAlign == "top" ? 0 : Number(stage.theatreBar?.offsetHeight)) -
			insert.label.style.lineHeight -
			20;
		
		insert.typingBubble.texture = <PIXI.Texture>resources["modules/theatre/app/graphics/typing.png"]?.texture;

		// TheatreStyle specific adjustments
		switch (TheatreSettings.getTheatreStyle()) {
			case TheatreStyle.LIGHTBOX: {
				// to allow top-aligned portraits to work without a seam
				dockContainer.y += insert.optAlign == "top" ? 8 : 0;
				insert.label.y -= insert.optAlign == "top" ? 8 : 0;
				break;
			}
			case TheatreStyle.CLEARBOX: {
				dockContainer.y = Number(stage.theatreDock?.offsetHeight) - portHeight;
				insert.label.y += insert.optAlign == "top" ? 0 : Number(stage.theatreBar?.offsetHeight);
				insert.typingBubble.y += insert.optAlign == "top" ? 0 : Number(stage.theatreBar?.offsetHeight);
				break;
			}
			case TheatreStyle.MANGABUBBLE: {
				break;
			}
			case TheatreStyle.TEXTBOX: {
				break;
			}
			default: {
				break;
			}
		}

		// run rigging animations if we have have any
		if (insert.emotion.emote) {
			let actorId = insert.imgId.replace("theatre-", "");
			let defaultDisabled = <boolean>this.theatre.isDefaultDisabled(insert.imgId);
			let emotes = ActorExtensions.getEmotesForActor(actorId, defaultDisabled);
			let rigResMap = ActorExtensions.getRiggingResources(actorId);
			if (emotes[insert.emotion.emote] && emotes[insert.emotion.emote]?.rigging) {
				const animations = <Animation[]>emotes[insert.emotion.emote]?.rigging?.animations;
				for (let anim of animations) {
					this.theatre.addTweensFromAnimationSyntax(anim.name, anim.syntax, rigResMap, insert);
				}
			}
		}

		if (reorder) {
			// fade in
			dockContainer.alpha = 0;

			window.setTimeout(() => {
				let tb = stage.getTextBoxById(imgId);
				if (tb) tb.style.opacity = "1";

				window.clearTimeout(this.theatre.reorderTOId);
				this.theatre.reorderTOId = window.setTimeout(() => {
					this.theatre.insertReorderer.reorderInserts();
					this.theatre.reorderTOId = null;
				}, 500);
			}, 100);
		} else {
			dockContainer.alpha = 1;
		}

		if (!this.theatre.rendering) {
			this.theatre._renderTheatre(performance.now());
		}
	}
}

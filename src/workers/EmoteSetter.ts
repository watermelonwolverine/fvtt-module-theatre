import type { EmoteDictionary } from "src/resources/resources_types";
import type StageInsert from "../components/stage/StageInsert";
import ActorExtensions from "../extensions/ActorExtensions";
import type Theatre from "../Theatre";

export default class EmoteSetter {
	theatre: Theatre;

	constructor(theatre: Theatre) {
		this.theatre = theatre;
	}

	/**
	 * Set the emote given the insert
	 * the moment the insert is in the RP bar
	 *
	 * @param ename: The emote name.
	 * @param insert: An Object representing the insert.
	 * @param remote: Wether this is being invoked remotely or locally.
	 *
	 */
	setEmoteForInsert(ename: string, insert: StageInsert, remote?: boolean) {
		// given the emote name, get the image if possible,
		// and add it to the insert canvas.
		//
		// If the insert already is that emote, do nothing,
		// If the insert emote does not exist, set the base insert
		// if the insert emote does not exist and the insert is
		// already either the base insert, or an emote without an
		// insert, do nothing

		if (!insert) return;
		let aEmote = insert.emotion.emote;
		let actorId = insert.imgId.replace("theatre-", "");
		let actor = game.actors?.get(actorId);
		if (!actor) return;

		let baseInsert = actor.data.img ? actor.data.img : "icons/mystery-man.png";

		if (actor.data.flags.theatre)
			baseInsert = actor.data.flags.theatre.baseinsert ? actor.data.flags.theatre.baseinsert : baseInsert;
		let emotes = <EmoteDictionary>ActorExtensions.getEmotesForActor(actorId);

		// emote already active
		//if ((this.speakingAs != insert.imgId && !this.isDelayEmote) || this.delayedSentState > 2)
		if (remote || !this.theatre.isDelayEmote) if (aEmote == ename || (ename == null && aEmote == null)) return;

		if (!!ename && emotes[ename] && emotes[ename]?.insert && emotes[ename]?.insert != "") {
			// clear the pixi container
			insert.clear();
			// set this sprite to span the PIXI Container via setupPortraitCanvas
			let imgSrcs: { imgpath: string; resname: string }[] = [];
			// emote base image
			const emoteResName: string = <string>emotes[ename]?.insert;
			imgSrcs.push({ imgpath: <string>emotes[ename]?.insert, resname: emoteResName });
			// add sprites
			this.theatre._addSpritesToPixi(imgSrcs, (loader, resources) => {
				// Error loading the sprite
				if (!resources[emoteResName] || resources[emoteResName]?.error) {
					console.error(
						"ERROR loading resource %s : %s : %s",
						insert.imgId,
						emoteResName,
						emotes[ename]?.insert
					);
					ui.notifications.error(
						game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1") +
							+emoteResName +
							game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2") +
							emotes[ename]?.insert +
							"'"
					);
					this.theatre.stage.removeInsertById(insert.imgId);
				}

				// flag our insert with our emote state
				insert.emotion.emote = ename;
				// now fix up the PIXI Container and make it pretty
				this.theatre.workers.portrait_container_setup_worker.setupPortraitContainer(
					insert.imgId,
					insert.optAlign,
					emoteResName,
					resources
				);
				// re-attach label + typingBubble
				(<PIXI.Container>insert.dockContainer).addChild(insert.label);
				(<PIXI.Container>insert.dockContainer).addChild(insert.typingBubble);

				this.theatre._repositionInsertElements(insert);

				if (!this.theatre.rendering) {
					this.theatre._renderTheatre(performance.now());
				}
			});
		} else {
			// load base insert unless the base insert is already loaded
			let loader = PIXI.Loader.shared;
			let baseExists = false;

			insert.clear();

			// flag our insert with our emote state, unless we're "actually" no emote rather
			// than just emoting with no insert available
			if (ename) {
				insert.emotion.emote = ename;
			} else {
				insert.emotion.emote = null;
			}
			// if baseInsert is not present, put it in
			if (!loader.resources[baseInsert]) {
				let imgSrcs: { imgpath: string; resname: string }[] = [];
				// clear the PIXI Container
				imgSrcs.push({ imgpath: baseInsert, resname: baseInsert });
				this.theatre._addSpritesToPixi(imgSrcs, (loader, resources) => {
					// Error loading the sprite
					if (!resources[baseInsert] || resources[baseInsert]?.error) {
						console.error("ERROR loading resource %s : %s : %s", insert.imgId, baseInsert, baseInsert);
						ui.notifications.error(
							game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1") +
								+baseInsert +
								game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2") +
								baseInsert +
								"'"
						);
						this.theatre.stage.removeInsertById(insert.imgId);
					}

					// now fix up the PIXI Container and make it pretty
					this.theatre.workers.portrait_container_setup_worker.setupPortraitContainer(
						insert.imgId,
						insert.optAlign,
						baseInsert,
						resources
					);

					// re-attach label + typingBubble
					(<PIXI.Container>insert.dockContainer).addChild(insert.label);
					(<PIXI.Container>insert.dockContainer).addChild(insert.typingBubble);

					this.theatre._repositionInsertElements(insert);

					if (!this.theatre.rendering) {
						this.theatre._renderTheatre(performance.now());
					}
				});
			} else {
				// base exists
				this.theatre.workers.portrait_container_setup_worker.setupPortraitContainer(
					insert.imgId,
					insert.optAlign,
					baseInsert,
					loader.resources
				);

				// re-attach label + typingBubble
				(<PIXI.Container>insert.dockContainer).addChild(insert.label);
				(<PIXI.Container>insert.dockContainer).addChild(insert.typingBubble);

				this.theatre._repositionInsertElements(insert);

				if (!this.theatre.rendering) this.theatre._renderTheatre(performance.now());
			}
		}
	}
}

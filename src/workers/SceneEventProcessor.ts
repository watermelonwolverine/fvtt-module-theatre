import Theatre from "../Theatre";
import EmotionDefinition from "../types/EmotionDefinition";
import type Stage from "../components/stage/Stage";
import type {
	AddAllTexturesEvent,
	AddTextureEvent,
	AnySceneEvent,
	DecayTextEvent,
	EmoteEvent,
	EnterSceneEvent,
	ExitSceneEvent,
	MoveEvent,
	NarratorEvent,
	PositionUpdateEvent,
	PushEvent,
	RenderInsertEvent,
	SceneEvent,
	StageEvent,
	SwapEvent,
} from "../types/SceneEvents";
import { AnySceneEventType, SceneEventTypes } from "../types/SceneEventTypes";
import Tools from "./Tools";
import type StageInsert from "src/components/stage/StageInsert";

export default class SceneEventProcessor {
	theatre: Theatre;
	stage: Stage;

	constructor(theatre: Theatre, stage: Stage) {
		this.theatre = theatre;
		this.stage = stage;
	}

	/**
	 * Process a scene update payload
	 *
	 * if we receive an event of the same type that is older
	 * than one we've already resceived, notify, and drop it.
	 *
	 */
	processSceneEvent(senderId: string, type: string, data: SceneEvent) {
		switch (type) {
			case SceneEventTypes.enterscene:
				this.processEnterSceneEvent(data as EnterSceneEvent);
				break;
			case SceneEventTypes.exitscene:
				this.processExitSceneEvent(data as ExitSceneEvent);
				break;
			case SceneEventTypes.positionupdate:
				this.processPositionEvent(data as PositionUpdateEvent);
				break;
			case SceneEventTypes.push:
				this.processPushEvent(data as PushEvent);
				break;
			case SceneEventTypes.swap:
				this.processSwapEvent(data as SwapEvent);
				break;
			case SceneEventTypes.move:
				this.processMoveEvent(data as MoveEvent);
				break;
			case SceneEventTypes.emote:
				this.processEmoteEvent(senderId, data as EmoteEvent);
				break;
			case SceneEventTypes.addtexture:
				this.processAddTextureEvent(data as AddTextureEvent);
				break;
			case SceneEventTypes.addalltextures:
				this.processAddAllTexturesEvent(data as AddAllTexturesEvent);
				break;
			case SceneEventTypes.stage:
				this.processStageEvent(data as StageEvent);
				break;
			case SceneEventTypes.narrator:
				this.processNarratorEvent(data as NarratorEvent);
				break;
			case SceneEventTypes.decaytext:
				this.processDecayTextEvent(data as DecayTextEvent);
				break;
			case SceneEventTypes.renderinsert:
				this.processRenderInsertEvent(data as RenderInsertEvent);
				break;
			default:
				throw new Error(`UNKNOWN SCENE EVENT: ${type} with data: ${data}`);
		}
	}

	processEnterSceneEvent(event: EnterSceneEvent) {
		const actorId = Tools.toActorId(event.insertid);
		const params = Tools.getInsertParamsFromActorId(actorId);

		const emotions = event.emotions ? event.emotions : new EmotionDefinition();

		if (!params) return;
		if (event.isleft)
			this.theatre.injectLeftPortrait(params.src, params.name, params.imgId, params.optalign, emotions, true);
		else this.theatre.injectRightPortrait(params.src, params.name, params.imgId, params.optalign, emotions, true);
	}

	processExitSceneEvent(event: ExitSceneEvent) {
		this.stage.removeInsertById(event.insertid, true);
	}

	processPositionEvent(event: PositionUpdateEvent) {
		const insert = this.stage.getInsertById(event.insertid);

		if (insert) {
			// apply mirror state
			if (Boolean(event.position.mirror) != insert.mirrored) insert.mirrored = event.position.mirror;
			let tweenId = "portraitMove";
			let tween = TweenMax.to(insert.portrait, 0.5, {
				scaleX: event.position.mirror ? -1 : 1,
				x: event.position.x,
				y: event.position.y,
				ease: Power3.easeOut,
				onComplete: function (ctx, imgId, tweenId) {
					// decrement the rendering accumulator
					ctx._removeDockTween(imgId, this, tweenId);
					// remove our own reference from the dockContainer tweens
				},
				onCompleteParams: [this, insert.imgId, tweenId],
			});
			this.theatre._addDockTween(insert.imgId, tween, tweenId);
		}
	}

	processPushEvent(event: PushEvent) {
		this.theatre.pushInsertById(event.insertid, event.tofront, true);
	}

	processSwapEvent(event: SwapEvent) {
		this.theatre.swapInsertsById(event.insertid1, event.insertid2, true);
	}

	processMoveEvent(data: MoveEvent) {
		this.theatre.moveInsertById(data.insertid1, data.insertid2, true);
	}

	processEmoteEvent(senderId: string, data: EmoteEvent) {
		const emotions = data.emotions;

		this.theatre.setUserEmote(senderId, data.insertid, "emote", <string>emotions.emote, true);
		this.theatre.setUserEmote(senderId, data.insertid, "textflyin", <string>emotions.textFlyin, true);
		this.theatre.setUserEmote(senderId, data.insertid, "textstanding", <string>emotions.textStanding, true);
		this.theatre.setUserEmote(senderId, data.insertid, "textfont", <string>emotions.textFont, true);
		this.theatre.setUserEmote(senderId, data.insertid, "textsize", String(emotions.textSize), true);
		this.theatre.setUserEmote(senderId, data.insertid, "textcolor", <string>emotions.textColor, true);

		if (data.insertid == this.theatre.speakingAs) this.theatre.emoteMenuRenderer.initialize();
	}

	processAddTextureEvent(event: AddTextureEvent) {
		const insert = <StageInsert>this.stage.getInsertById(event.insertid);
		const actorId = Tools.toActorId(event.insertid);

		const params = Tools.getInsertParamsFromActorId(actorId);

		if (!params) {
			return;
		}

		const app = this.stage.pixiApplication;

		const insertEmote = this.theatre._getEmoteFromInsert(insert);
		let render = false;

		if (insertEmote == event.emote) render = true;
		else if (!event.emote) render = true;

		this.theatre._AddTextureResource(
			event.imgsrc,
			event.resname,
			event.insertid,
			event.emote,
			(loader: PIXI.Loader, resources: PIXI.IResourceDictionary) => {
				// if oure emote is active and we're replacing the emote texture, or base is active, and we're replacing the base texture

				if (render && app && insert && insert.dockContainer) {
					// bubble up dataum from the update
					insert.optAlign = params.optalign;
					insert.name = params.name;
					insert.label.text = params.name;

					insert.clear();

					this.theatre.workers.portrait_container_setup_worker.setupPortraitContainer(
						event.insertid,
						insert.optAlign,
						event.resname,
						resources
					);
					// re-attach label + typingBubble
					insert.dockContainer.addChild(insert.label);
					insert.dockContainer.addChild(insert.typingBubble);

					this.theatre._repositionInsertElements(insert);

					if (event.insertid == this.theatre.speakingAs) {
						this.theatre.emoteMenuRenderer.initialize();
					}
					if (!this.theatre.rendering) {
						this.theatre._renderTheatre(performance.now());
					}
				}
			},
			true
		);
	}

	processAddAllTexturesEvent(event: AddAllTexturesEvent) {
		const insert = <StageInsert>this.stage.getInsertById(event.insertid);
		const actorId = Tools.toActorId(event.insertid);
		const params = Tools.getInsertParamsFromActorId(actorId);

		if (!params) {
			return;
		}

		const app = this.stage.pixiApplication;
		const insertEmote = this.theatre._getEmoteFromInsert(insert);
		let render = false;

		if (insertEmote == event.emote) render = true;
		else if (!event.emote) render = true;

		this.theatre._AddAllTextureResources(
			event.imgsrcs,
			event.insertid,
			event.emote,
			event.eresname,
			// TODO refactor: This is almost the same as above
			(loader: PIXI.Loader, resources: PIXI.IResourceDictionary) => {
				// if oure emote is active and we're replacing the emote texture, or base is active, and we're replacing the base texture

				if (render && app && insert && insert.dockContainer && event.eresname) {
					// bubble up dataum from the update
					insert.optAlign = params.optalign;
					insert.name = params.name;
					insert.label.text = params.name;

					insert.clear();

					this.theatre.workers.portrait_container_setup_worker.setupPortraitContainer(
						event.insertid,
						insert.optAlign,
						event.eresname,
						resources
					);
					// re-attach label + typingBubble
					insert.dockContainer.addChild(insert.label);
					insert.dockContainer.addChild(insert.typingBubble);

					this.theatre._repositionInsertElements(insert);

					if (event.insertid == this.theatre.speakingAs) {
						this.theatre.emoteMenuRenderer.initialize();
					}
					if (!this.theatre.rendering) {
						this.theatre._renderTheatre(performance.now());
					}
				}
			},
			true
		);
	}
	processStageEvent(event: StageEvent) {
		this.theatre.stageInsertById(event.insertid, true);
	}
	processNarratorEvent(event: NarratorEvent) {
		this.theatre.toggleNarratorBar(event.active, true);
	}
	processDecayTextEvent(event: DecayTextEvent) {
		this.theatre.decayTextBoxById(event.insertid, true);
	}
	processRenderInsertEvent(event: RenderInsertEvent) {
		const insert = this.stage.getInsertById(event.insertid);
		if (insert) this.theatre.renderInsertById(event.insertid);
	}

	/**
	 * Send a packet to all clients indicating the event type, and
	 * the data relevant to the event. The caller must specify this
	 * data.
	 *
	 * Scene Event Sub Types
	 *
	 */
	sendSceneEvent(eventType: AnySceneEventType, eventData: AnySceneEvent) {
		// TODO Use socketlib instead
		game.socket?.emit(Theatre.SOCKET, {
			senderId: <string>game.user?.id,
			type: "sceneevent",
			subtype: eventType,
			data: eventData,
		});
	}
}

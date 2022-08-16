import Theatre from "../Theatre";
import EmotionDefinition from "../types/EmotionDefinition";
import Stage from "../types/Stage";
import StageInsert from "../types/StageInsert";
import { AddAllTexturesEvent, AddTextureEvent, DecayTextEvent, EmoteEvent, EnterSceneEvent, ExitSceneEvent, MoveEvent, NarratorEvent, PositionUpdateEvent, PushEvent, RenderInsertEvent, SceneEvent, StageEvent, SwapEvent } from "./SceneEvents";
import Tools from "./Tools";

export class SceneEventTypes {
    /** an insert was injected remotely */
    static enterscene = "enterscene";
    /** an insert was removed remotely */
    static exitscene = "exitscene";
    /** an insert was moved removely */
    static positionupdate = "positionupdate";
    /** an insert was pushed removely */
    static push = "push";
    /** an insert was swapped remotely */
    static swap = "swap";
    static move = "move";
    /** the narrator bar was activated remotely */
    static emote = "emote";
    /** a texture asset was added remotely */
    static addtexture = "addtexture";
    /** a group of textures were added remotely */
    static addalltextures = "addalltextures";
    /** an insert's assets were staged remotely */
    static stage = "stage";
    /** the narrator bar was activated remotely */
    static narrator = "narrator";
    /** an insert's text was decayed remotely */
    static decaytext = "decaytext";
    /** an insert is requesting to be rendered immeidately remotely */
    static renderinsert = "renderinsert";

}

export default class SceneEventProcessor {

    theatre: Theatre;
    stage: Stage;

    constructor(theatre: Theatre,
        stage: Stage) {
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
    processSceneEvent(
        senderId: string,
        type: string,
        data: SceneEvent) {

        let insert: StageInsert;

        switch (type) {
            case SceneEventTypes.enterscene:
                this.processEnterSceneEvent(data as EnterSceneEvent)
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
                this.processEmoteEvent(
                    senderId,
                    data as EmoteEvent);
                break;
            case SceneEventTypes.addtexture:
                this.processAddTextureEvent(data as AddTextureEvent)
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
        else
            this.theatre.injectRightPortrait(params.src, params.name, params.imgId, params.optalign, emotions, true);

    }

    processExitSceneEvent(event: ExitSceneEvent) {
        this.stage.removeInsertById(event.insertid, true);
    }

    processPositionEvent(event: PositionUpdateEvent) {

        const insert = this.stage.getInsertById(event.insertid);

        if (insert) {
            // apply mirror state
            if (Theatre.DEBUG) console.log("mirroring desired: %s , current mirror %s", event.position.mirror, insert.mirrored);
            if (Boolean(event.position.mirror) != insert.mirrored)
                insert.mirrored = event.position.mirror;
            let tweenId = "portraitMove";
            let tween = TweenMax.to(insert.portrait, 0.5, {
                scaleX: (event.position.mirror ? -1 : 1),
                x: event.position.x,
                y: event.position.y,
                ease: Power3.easeOut,
                onComplete: function (ctx, imgId, tweenId) {
                    // decrement the rendering accumulator
                    ctx._removeDockTween(imgId, this, tweenId);
                    // remove our own reference from the dockContainer tweens
                },
                onCompleteParams: [this, insert.imgId, tweenId]
            });
            this.theatre._addDockTween(insert.imgId, tween, tweenId);
        }
    }

    processPushEvent(event: PushEvent) {
        this.theatre.pushInsertById(
            event.insertid,
            event.tofront,
            true);
    }

    processSwapEvent(event: SwapEvent) {
        this.theatre.swapInsertsById(
            event.insertid1,
            event.insertid2,
            true);
    }

    processMoveEvent(data: MoveEvent) {
        this.theatre.moveInsertById(
            data.insertid1,
            data.insertid2,
            true);
    }

    processEmoteEvent(
        senderId: string,
        data: EmoteEvent) {

        const emotions = data.emotions;

        this.theatre.setUserEmote(senderId, data.insertid, "emote", emotions.emote, true);
        this.theatre.setUserEmote(senderId, data.insertid, "textflyin", emotions.textFlyin, true);
        this.theatre.setUserEmote(senderId, data.insertid, "textstanding", emotions.textStanding, true);
        this.theatre.setUserEmote(senderId, data.insertid, "textfont", emotions.textFont, true);
        this.theatre.setUserEmote(senderId, data.insertid, "textsize", emotions.textSize, true);
        this.theatre.setUserEmote(senderId, data.insertid, "textcolor", emotions.textColor, true);

        if (data.insertid == this.theatre.speakingAs)
            this.theatre.emoteMenuRenderer.initialize();

    }

    processAddTextureEvent(event: AddTextureEvent) {

        const insert = this.stage.getInsertById(event.insertid);
        const actorId = Tools.toActorId(event.insertid);

        const params = Tools.getInsertParamsFromActorId(actorId);

        if (!params) {
            return;
        }

        const app = this.stage.pixiApplication;

        const insertEmote = this.theatre._getEmoteFromInsert(insert);
        let render = false;

        if (insertEmote == event.emote)
            render = true;
        else if (!event.emote)
            render = true;

        this.theatre._AddTextureResource(
            event.imgsrc,
            event.resname,
            event.insertid,
            event.emote,
            (loader: PIXI.Loader, resources: PIXI.IResourceDictionary) => {
                // if oure emote is active and we're replacing the emote texture, or base is active, and we're replacing the base texture

                if (render
                    && app
                    && insert
                    && insert.dockContainer) {

                    // bubble up dataum from the update
                    insert.optAlign = params.optalign;
                    insert.name = params.name;
                    insert.label.text = params.name;

                    this.theatre._clearPortraitContainer(event.insertid);
                    this.theatre.workers.portrait_container_setup_worker.setupPortraitContainer(
                        event.insertid,
                        insert.optAlign,
                        event.resname,
                        resources);
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
            }, true);
    }

    processAddAllTexturesEvent(event: AddAllTexturesEvent) {

        const insert = this.stage.getInsertById(event.insertid);
        const actorId = Tools.toActorId(event.insertid);
        const params = Tools.getInsertParamsFromActorId(actorId);

        if (!params) {
            return;
        }

        const app = this.stage.pixiApplication;
        const insertEmote = this.theatre._getEmoteFromInsert(insert);
        let render = false;

        if (insertEmote == event.emote)
            render = true;
        else if (!event.emote)
            render = true;

        this.theatre._AddAllTextureResources(
            event.imgsrcs,
            event.insertid,
            event.emote,
            event.eresname,
            // TODO refactor: This is almost the same as above
            (loader: PIXI.Loader, resources: PIXI.IResourceDictionary) => {
                // if oure emote is active and we're replacing the emote texture, or base is active, and we're replacing the base texture

                if (Theatre.DEBUG) console.log("add all textures complete! ", event.emote, event.eresname, params.emotes[event.emote]);
                if (render
                    && app
                    && insert
                    && insert.dockContainer
                    && event.eresname) {
                    if (Theatre.DEBUG) console.log("RE-RENDERING with NEW texture resource %s", event.eresname);

                    // bubble up dataum from the update
                    insert.optAlign = params.optalign;
                    insert.name = params.name;
                    insert.label.text = params.name;

                    this.theatre._clearPortraitContainer(event.insertid);
                    this.theatre.workers.portrait_container_setup_worker.setupPortraitContainer(
                        event.insertid,
                        insert.optAlign,
                        event.eresname,
                        resources);
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
            }, true);
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
        if (insert)
            this.theatre.renderInsertById(event.insertid);
    }










    /**
     * Send a packet to all clients indicating the event type, and
     * the data relevant to the event. The caller must specify this
     * data.
     *
     * Scene Event Sub Types
     *
     */
    sendSceneEvent(
        eventType: string,
        eventData: ExitSceneEvent | PositionUpdateEvent | EnterSceneEvent) {

        // Do we even need verification? There's no User Input outside of 
        // cookie cutter responses

        game.socket.emit(Theatre.SOCKET,
            {
                senderId: game.user.id,
                type: "sceneevent",
                subtype: eventType,
                data: eventData
            }
        );

    }
}
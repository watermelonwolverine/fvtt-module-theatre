import Theatre from "../Theatre";
import EmotionDefinition from "../types/EmotionDefinition";
import Params from "../types/Params";
import Stage from "../types/Stage";
import StageInsert from "../types/StageInsert";
import Tools from "./Tools";

export class Position {
    x: number;
    y: number;
    mirror: boolean;
}

// TODO split this into several event types
export class SceneEventDataBase { };

// TODO split this into several event types
export class SceneEventData {
    insertid: string;
    emotions: EmotionDefinition;
    isleft: boolean;
    insertid1: string;
    insertid2: string;
    tofront: boolean;
    emote: string;
    imgsrc: string;
    resname: string;
    eresname: string;
    imgsrcs: string[];
    active: boolean;
};

export class PositionUpdateEvent extends SceneEventDataBase {
    insertid: string;
    position: Position;
}

export class ExitSceneEvent extends SceneEventDataBase {
    insertid: string;
}

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
        data: SceneEventData) {

        let insert: StageInsert;
        let actorId: string;
        let params: Params;
        let emote: string;
        let port;
        let emotions;
        let resName;
        let app: PIXI.Application;
        let insertEmote;
        let render: boolean;

        switch (type) {
            case SceneEventTypes.enterscene:
                actorId = Tools.toActorId(data.insertid);
                params = Tools.getInsertParamsFromActorId(actorId);

                emotions = (data.emotions ? data.emotions : {
                    emote: null,
                    textFlying: null,
                    textStanding: null,
                    textFont: null,
                    textSize: null,
                    textColor: null
                });

                if (!params) return;
                if (data.isleft)
                    this.theatre.injectLeftPortrait(params.src, params.name, params.imgId, params.optalign, emotions, true);
                else
                    this.theatre.injectRightPortrait(params.src, params.name, params.imgId, params.optalign, emotions, true);

                break;
            case SceneEventTypes.exitscene:
                this.stage.removeInsertById(data.insertid, true);
                break;
            case SceneEventTypes.positionupdate:

                insert = this.stage.getInsertById(data.insertid);

                const positionUpdateEvent = data as unknown as PositionUpdateEvent;

                if (insert) {
                    // apply mirror state
                    if (Theatre.DEBUG) console.log("mirroring desired: %s , current mirror %s", positionUpdateEvent.position.mirror, insert.mirrored);
                    if (Boolean(positionUpdateEvent.position.mirror) != insert.mirrored)
                        insert.mirrored = positionUpdateEvent.position.mirror;
                    let tweenId = "portraitMove";
                    let tween = TweenMax.to(insert.portrait, 0.5, {
                        scaleX: (positionUpdateEvent.position.mirror ? -1 : 1),
                        x: positionUpdateEvent.position.x,
                        y: positionUpdateEvent.position.y,
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
                break;
            case SceneEventTypes.push:
                this.theatre.pushInsertById(
                    data.insertid,
                    data.tofront,
                    true);
                break;
            case SceneEventTypes.swap:
                this.theatre.swapInsertsById(
                    data.insertid1,
                    data.insertid2,
                    true);
                break;
            case SceneEventTypes.move:
                this.theatre.moveInsertById(
                    data.insertid1,
                    data.insertid2,
                    true);
                break;
            case SceneEventTypes.emote:
                emote = data.emotions.emote;
                let textFlyin = data.emotions.textFlyin;
                let textStanding = data.emotions.textStanding;
                let textFont = data.emotions.textFont;
                let textSize = data.emotions.textSize;
                let textColor = data.emotions.textColor;
                this.theatre.setUserEmote(senderId, data.insertid, "emote", emote, true);
                this.theatre.setUserEmote(senderId, data.insertid, "textflyin", textFlyin, true);
                this.theatre.setUserEmote(senderId, data.insertid, "textstanding", textStanding, true);
                this.theatre.setUserEmote(senderId, data.insertid, "textfont", textFont, true);
                this.theatre.setUserEmote(senderId, data.insertid, "textsize", textSize, true);
                this.theatre.setUserEmote(senderId, data.insertid, "textcolor", textColor, true);

                if (data.insertid == this.theatre.speakingAs)
                    this.theatre.emoteMenuRenderer.initialize();

                break;
            case SceneEventTypes.addtexture:
                if (Theatre.DEBUG) console.log("texturereplace:", data);
                insert = this.stage.getInsertById(data.insertid);
                actorId = data.insertid.replace("theatre-", "");
                params = Tools.getInsertParamsFromActorId(actorId);
                if (!params) return;

                app = this.stage.pixiApplication;
                insertEmote = this.theatre._getEmoteFromInsert(insert);
                render = false;

                if (insertEmote == data.emote)
                    render = true;
                else if (!data.emote)
                    render = true;

                this.theatre._AddTextureResource(
                    data.imgsrc,
                    data.resname,
                    data.insertid,
                    data.emote,
                    (loader: PIXI.Loader, resources: PIXI.IResourceDictionary) => {
                        // if oure emote is active and we're replacing the emote texture, or base is active, and we're replacing the base texture

                        if (render && app && insert && insert.dockContainer) {
                            if (Theatre.DEBUG) console.log("RE-RENDERING with NEW texture resource %s : %s", data.resname, data.imgsrc);

                            // bubble up dataum from the update
                            insert.optAlign = params.optalign;
                            insert.name = params.name;
                            insert.label.text = params.name;

                            this.theatre._clearPortraitContainer(data.insertid);
                            this.theatre.workers.portrait_container_setup_worker.setupPortraitContainer(
                                data.insertid,
                                insert.optAlign,
                                data.resname,
                                resources);
                            // re-attach label + typingBubble
                            insert.dockContainer.addChild(insert.label);
                            insert.dockContainer.addChild(insert.typingBubble);

                            this.theatre._repositionInsertElements(insert);

                            if (data.insertid == this.theatre.speakingAs) {
                                this.theatre.emoteMenuRenderer.initialize();
                            }
                            if (!this.theatre.rendering) {
                                this.theatre._renderTheatre(performance.now());
                            }
                        }
                    }, true);
                break;
            case SceneEventTypes.addalltextures:
                if (Theatre.DEBUG) console.log("textureallreplace:", data);
                insert = this.stage.getInsertById(data.insertid);
                actorId = data.insertid.replace("theatre-", "");
                params = Tools.getInsertParamsFromActorId(actorId);
                if (!params) return;

                app = this.stage.pixiApplication;
                insertEmote = this.theatre._getEmoteFromInsert(insert);
                render = false;

                if (insertEmote == data.emote)
                    render = true;
                else if (!data.emote)
                    render = true;

                this.theatre._AddAllTextureResources(
                    data.imgsrcs,
                    data.insertid,
                    data.emote,
                    data.eresname,
                    // TODO refactor: This is almost the same as above
                    (loader: PIXI.Loader, resources: PIXI.IResourceDictionary) => {
                        // if oure emote is active and we're replacing the emote texture, or base is active, and we're replacing the base texture

                        if (Theatre.DEBUG) console.log("add all textures complete! ", data.emote, data.eresname, params.emotes[data.emote]);
                        if (render
                            && app
                            && insert
                            && insert.dockContainer
                            && data.eresname) {
                            if (Theatre.DEBUG) console.log("RE-RENDERING with NEW texture resource %s", data.eresname);

                            // bubble up dataum from the update
                            insert.optAlign = params.optalign;
                            insert.name = params.name;
                            insert.label.text = params.name;

                            this.theatre._clearPortraitContainer(data.insertid);
                            this.theatre.workers.portrait_container_setup_worker.setupPortraitContainer(
                                data.insertid,
                                insert.optAlign,
                                data.eresname,
                                resources);
                            // re-attach label + typingBubble
                            insert.dockContainer.addChild(insert.label);
                            insert.dockContainer.addChild(insert.typingBubble);

                            this.theatre._repositionInsertElements(insert);

                            if (data.insertid == this.theatre.speakingAs) {
                                this.theatre.emoteMenuRenderer.initialize();
                            }
                            if (!this.theatre.rendering) {
                                this.theatre._renderTheatre(performance.now());
                            }
                        }
                    }, true);

                break;
            case SceneEventTypes.stage:
                if (Theatre.DEBUG) console.log("staging insert", data.insertid);
                this.theatre.stageInsertById(data.insertid, true);
                break;
            case SceneEventTypes.narrator:
                if (Theatre.DEBUG) console.log("toggle narrator bar", data.active);
                this.theatre.toggleNarratorBar(data.active, true);
                break;
            case SceneEventTypes.decaytext:
                if (Theatre.DEBUG) console.log("decay textbox", data.insertid);
                this.theatre.decayTextBoxById(data.insertid, true);
                break;
            case SceneEventTypes.renderinsert:
                insert = this.stage.getInsertById(data.insertid);
                if (insert)
                    this.theatre.renderInsertById(data.insertid);
                break;
            default:
                console.log("UNKNOWN SCENE EVENT: %s with data: ", type, data);
        }
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
        eventData: SceneEventData | ExitSceneEvent | PositionUpdateEvent) {

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
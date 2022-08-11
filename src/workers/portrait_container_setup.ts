/* eslint-disable no-unused-vars */
import Resources from "../extensions/foundry_extensions.js";
import Theatre from "../Theatre.js";
import ActorExtensions from "../extensions/ActorExtensions.js";
import _TheatreWorkers from "./workers.js";
import TheatreSettings from "../extensions/settings.js";
import TheatreStyle from "../types/TheatreStyle.js";
import Stage from "../types/Stage.js";
import Portrait from "../types/Portrait.js";

export default class _TheatrePortraitContainerSetupWorker {

    context: Theatre;
    workers: _TheatreWorkers;

    constructor(context: Theatre,
        workers: _TheatreWorkers) {
        this.context = context;
        this.workers = workers;
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
        optAlign: string,
        resName: string,
        resources: Resources,
        reorder: boolean): void {
        let insert = this.context.stage.getInsertById(imgId);

        const stage = this.context.stage;


        if (!insert || !insert.dockContainer) {
            console.error("ERROR PIXI Container was destroyed before setup could execute for %s", imgId);
            ui.notifications.error(`${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1")} ${imgId} ${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2")} ${resName}`);
            stage.removeInsertById(imgId);
            return;
        }

        if (!resources[resName] || !resources[resName].texture) {
            console.error("ERROR could not load texture %s", resName, resources);
            ui.notifications.error(`${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1")} ${imgId} ${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2")} ${resName}`);
            stage.removeInsertById(imgId);
            return;
        }

        let dockContainer = insert.dockContainer;
        let portraitContainer = insert.portraitContainer;

        let sprite = new PIXI.Sprite(resources[resName].texture);

        insert.portrait = sprite;
        portraitContainer.addChild(sprite);
        // set the initial dockContainer position + state
        //dockContainer.x = 0;

        // set sprite initial coordinates + state
        sprite.x = 0;
        sprite.y = 0;
        // set mirror state if mirrored
        if (insert.mirrored) {
            portraitContainer.scale.x = -1;
            /*
            if (reorder)
                portraitContainer.x = portWidth; 
            */
        }
        // setup label if not setup
        if (!insert.label) {
            let textStyle = new PIXI.TextStyle({
                align: "center",
                fontFamily: Theatre.instance.titleFont,
                fontSize: 44,
                lineHeight: 64,
                //fontStyle: 'italic',
                fontWeight: this.context.fontWeight,
                fill: ['#ffffff'],
                stroke: '#000000',
                strokeThickness: 2,
                dropShadow: true,
                dropShadowColor: '#000000',
                dropShadowBlur: 1,
                dropShadowAngle: Math.PI / 6,
                breakWords: true,
                wordWrap: true
            });
            let label = new PIXI.Text(insert.name, textStyle);
            // save and stage our label
            label.theatreComponentName = "label";
            insert.label = label;
            dockContainer.addChild(label);
            // initital positioning
            insert.label.x = 20;
        }


        // setup typing bubble
        if (!insert.typingBubble) {
            let typingBubble = new PIXI.Sprite();
            typingBubble.texture = resources["modules/theatre/app/graphics/typing.png"].texture;
            typingBubble.width = 55;
            typingBubble.height = 55;
            typingBubble.theatreComponentName = "typingBubble";
            typingBubble.alpha = 0;


            insert.typingBubble = typingBubble;
            dockContainer.addChild(typingBubble);
        }

        // run rigging animations if we have have any
        if (insert.emote) {
            let actorId = insert.imgId.replace("theatre-", "");
            let defaultDisabled = this.context.isDefaultDisabled(insert.imgId);
            if (Theatre.DEBUG) console.log("is default disabled? : %s", defaultDisabled);
            let emotes = ActorExtensions.getEmotes(actorId, defaultDisabled);
            let rigResMap = ActorExtensions.getRiggingResources(actorId);
            if (emotes[insert.emote] && emotes[insert.emote].rigging) {
                for (let anim of emotes[insert.emote].rigging.animations) {
                    this.context.addTweensFromAnimationSyntax(anim.name, anim.syntax, rigResMap, insert);
                }
            }
        }

        if (reorder) {
            // fade in
            dockContainer.alpha = 0;

            window.setTimeout(() => {
                let tb = <HTMLElement>this.context._getTextBoxById(imgId);
                if (tb) tb.style.opacity = "1";

                window.clearTimeout(this.context.reorderTOId)
                this.context.reorderTOId = window.setTimeout(() => {
                    this.context.insertReorderer.reorderInserts();
                    this.context.reorderTOId = null;
                }, 500);
            }, 100);
        } else {
            dockContainer.alpha = 1;
        }

        new Portrait(
            stage,
            insert).updatePortraitDimensions();

        if (!this.context.rendering)
            this.context._renderTheatre(performance.now());
    }

}
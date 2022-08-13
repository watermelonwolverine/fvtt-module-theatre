/* eslint-disable no-unused-vars */
import Resources from "../extensions/foundry_extensions";
import Theatre from "../Theatre";
import ActorExtensions from "../extensions/ActorExtensions";
import _TheatreWorkers from "./workers";
import TheatreSettings from "../extensions/settings";
import TheatreStyle from "../types/TheatreStyle";
import Stage from "../types/Stage";
import Portrait from "../types/Portrait";

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
        optAlign: string, // TODO remove
        resName: string,
        resources: Resources,
        reorder: boolean): void {


        const stage = this.context.stage;
        const insert = stage.getInsertById(imgId);

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

        insert.portrait = new PIXI.Sprite(resources[resName].texture);

        const portrait = new Portrait(stage,
            insert);

        portraitContainer.addChild(insert.portrait);

        portrait.updatePortrait();

        const portraitDimensions = portrait.calculatePortraitDimensions();

        const portWidth = portraitDimensions.width;
        const portHeight = portraitDimensions.height;


        // setup label if not setup
        if (!insert.label) {
            let textStyle = new PIXI.TextStyle({
                align: "center",
                fontFamily: TheatreSettings.getTitleFont(),
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
                wordWrap: true,
                wordWrapWidth: portWidth
            });
            let label = new PIXI.Text(insert.name, textStyle);
            // save and stage our label
            label.theatreComponentName = "label";
            insert.label = label;
            dockContainer.addChild(label);
            // initital positioning
            insert.label.x = 20;
        }
        insert.label.y = portHeight - (insert.optAlign == "top" ? 0 : stage.theatreBar.offsetHeight) - insert.label.style.lineHeight - 20;


        // setup typing bubble
        if (!insert.typingBubble) {
            let typingBubble = new PIXI.Sprite();
            typingBubble.texture = resources["modules/theatre/app/graphics/typing.png"].texture;
            typingBubble.width = 55;
            typingBubble.height = 55;
            typingBubble.theatreComponentName = "typingBubble";
            typingBubble.alpha = 0;
            typingBubble.y = portHeight -
                (insert.optAlign  == "top" ? 0 : stage.theatreBar.offsetHeight) - insert.label.style.lineHeight + typingBubble.height / 2;


            insert.typingBubble = typingBubble;
            dockContainer.addChild(typingBubble);
        }

        // TheatreStyle specific adjustments
        switch (TheatreSettings.getTheatreStyle()) {
            case TheatreStyle.LIGHTBOX:
                // to allow top-aligned portraits to work without a seam
                dockContainer.y += (insert.optAlign  == "top" ? 8 : 0);
                insert.label.y -= (insert.optAlign == "top" ? 8 : 0);
                break;
            case TheatreStyle.CLEARBOX:
                dockContainer.y = stage.theatreDock.offsetHeight - portHeight;
                insert.label.y += (insert.optAlign  == "top" ? 0 : stage.theatreBar.offsetHeight);
                insert.typingBubble.y += (insert.optAlign  == "top" ? 0 : stage.theatreBar.offsetHeight);
                break;
            case TheatreStyle.MANGABUBBLE:
                break;
            case TheatreStyle.TEXTBOX:
                break;
            default:
                break;
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
                let tb = stage.getTextBoxById(imgId);
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

        if (!this.context.rendering)
            this.context._renderTheatre(performance.now());
    }

}
/* eslint-disable no-unused-vars */
import Resources from "../foundry_extensions.js";
import Theatre from "../Theatre.js";
import ActorExtensions from "../ActorExtensions.js";
import _TheatreWorkers from "./workers.js";
import TheatreSettings from "../settings.js";

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
        reorder: boolean) {
        let insert = this.context.getInsertById(imgId);



        if (!insert || !insert.dockContainer) {
            console.error("ERROR PIXI Container was destroyed before setup could execute for %s", imgId);
            ui.notifications.error(`${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1")} ${imgId} ${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2")} ${resName}`);
            this.context.removeInsertById(imgId);
            return;
        }

        if (!resources[resName] || !resources[resName].texture) {
            console.error("ERROR could not load texture %s", resName, resources);
            ui.notifications.error(`${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1")} ${imgId} ${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2")} ${resName}`);
            this.context.removeInsertById(imgId);
            return;
        }

        let dockContainer = insert.dockContainer;
        let portraitContainer = insert.portraitContainer;

        let sprite = new PIXI.Sprite(resources[resName].texture);
        let portWidth = resources[resName].texture.width;
        let portHeight = resources[resName].texture.height;
        let maxHeight = <number>game.settings.get(TheatreSettings.NAMESPACE, TheatreSettings.THEATRE_IMAGE_SIZE);
        if (portHeight > maxHeight) {
            portWidth *= maxHeight / portHeight;
            portHeight = maxHeight;
        }

        // adjust dockContainer + portraitContainer dimensions to fit the image
        dockContainer.width = portWidth;
        dockContainer.height = portHeight;
        portraitContainer.width = portWidth;
        portraitContainer.height = portHeight;

        // set the initial dockContainer position + state
        //dockContainer.x = 0;
        dockContainer.y = this.context.theatreDock.offsetHeight - (optAlign == "top" ? this.context.theatreBar.offsetHeight : 0) - portHeight;

        // save and stage our sprite
        insert.portrait = sprite;
        insert.portrait.width = portWidth;
        insert.portrait.height = portHeight;

        portraitContainer.addChild(sprite);
        portraitContainer.pivot.x = portWidth / 2;
        portraitContainer.pivot.y = portHeight / 2;
        portraitContainer.x = portraitContainer.x + portWidth / 2;
        portraitContainer.y = portraitContainer.y + portHeight / 2;
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
        // position the label
        insert.label.y = portHeight - (optAlign == "top" ? 0 : this.context.theatreBar.offsetHeight) - insert.label.style.lineHeight - 20;

        // setup typing bubble
        if (!insert.typingBubble) {
            let typingBubble = new PIXI.Sprite();
            typingBubble.texture = resources["modules/theatre/app/graphics/typing.png"].texture;
            typingBubble.width = 55;
            typingBubble.height = 55;
            typingBubble.theatreComponentName = "typingBubble";
            typingBubble.alpha = 0;
            typingBubble.y = portHeight -
                (optAlign == "top" ? 0 : this.context.theatreBar.offsetHeight) - insert.label.style.lineHeight + typingBubble.height / 2;

            insert.typingBubble = typingBubble;
            dockContainer.addChild(typingBubble);
        }

        // TheatreStyle specific adjustments
        switch (this.context.settings.theatreStyle) {
            case "lightbox":
                // to allow top-aligned portraits to work without a seam
                dockContainer.y += (optAlign == "top" ? 8 : 0);
                insert.label.y -= (insert.optAlign == "top" ? 8 : 0);
                break;
            case "clearbox":
                dockContainer.y = this.context.theatreDock.offsetHeight - portHeight;
                insert.label.y += (optAlign == "top" ? 0 : this.context.theatreBar.offsetHeight);
                insert.typingBubble.y += (optAlign == "top" ? 0 : this.context.theatreBar.offsetHeight);
                break;
            case "mangabubble":
                break;
            case "textbox":
                break;
            default:
                break;
        }

        if (Theatre.DEBUG) console.log("Portrait loaded with w:%s h:%s", portWidth, portHeight, sprite);

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

        if (Theatre.DEBUG) {
            // DEBUG BOX dockContainer
            let graphics = new PIXI.Graphics();
            graphics.lineStyle(1, 0xFEEB77, 1);
            graphics.moveTo(0, 0);
            graphics.lineTo(portWidth, 0);
            graphics.lineTo(portWidth, portHeight);
            graphics.lineTo(0, portHeight);
            graphics.lineTo(0, 0);
            dockContainer.addChild(graphics);
            let dimStyle = new PIXI.TextStyle({
                fontSize: 10,
                lineHeight: 30,
                fontWeight: "bold",
                fill: ['#FF383A'],
                stroke: '#000000',
                strokeThickness: 2,
                wordWrap: true,
                wordWrapWidth: portWidth
            });
            let pathStyle = new PIXI.TextStyle({
                fontSize: 22,
                lineHeight: 22,
                fontWeight: "bold",
                fill: ['#38FFEB'],
                stroke: '#000000',
                strokeThickness: 2,
                wordWrap: true,
                breakWords: true,
                wordWrapWidth: portWidth
            });
            let infoStyle = new PIXI.TextStyle({
                fontSize: 14,
                lineHeight: 14,
                fontWeight: "bold",
                fill: ['#ffffff'],
                stroke: '#000000',
                strokeThickness: 2,
                wordWrap: true,
                breakWords: true,
                wordWrapWidth: portWidth
            });
            let dims = new PIXI.Text(`${portWidth} px x ${portHeight} px`, dimStyle);
            let path = new PIXI.Text(resources[resName].url, pathStyle);
            let info = new PIXI.Text("X", infoStyle);
            info.theatreComponentName = "debugInfo";
            dims.x = 20;
            path.x = 20;
            path.y = 30;
            info.x = 20;
            info.y = 90;
            dockContainer.addChild(dims);
            dockContainer.addChild(path);
            dockContainer.addChild(info);
            this.context._updateTheatreDebugInfo(insert);

            // DEBUG BOX portraitContainer
            graphics = new PIXI.Graphics();
            graphics.lineStyle(1, 0xFFFFFF, 1);
            graphics.moveTo(0, 0);
            graphics.lineTo(portWidth, 0);
            graphics.lineTo(portWidth, portHeight);
            graphics.lineTo(0, portHeight);
            graphics.lineTo(0, 0);
            portraitContainer.addChild(graphics);
        }

        if (reorder) {
            // fade in
            dockContainer.alpha = 0;

            window.setTimeout(() => {
                let tb = <HTMLElement>this.context._getTextBoxById(imgId);
                if (tb) tb.style.opacity = "1";

                window.clearTimeout(this.context.reorderTOId)
                this.context.reorderTOId = window.setTimeout(() => {
                    Theatre.reorderInserts();
                    this.context.reorderTOId = null;
                }, 500);
            }, 100);
        } else {
            dockContainer.alpha = 1;
        }

        //app.render(); 
        if (!this.context.rendering)
            this.context._renderTheatre(performance.now());
    }

}
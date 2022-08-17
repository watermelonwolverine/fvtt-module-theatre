/* eslint-disable no-unused-vars */
import Portrait from "../components/stage/Portrait";
import StageInsert from "../components/stage/StageInsert";
import ActorExtensions from "../extensions/ActorExtensions";
import TheatreSettings from "../extensions/TheatreSettings";
import { RiggingResource } from "../resources/resources_types";
import Theatre from "../Theatre";
import EmotionDefinition from "../types/EmotionDefinition";
import Params from "../types/Params";
import TheatrePortraitContainerSetupWorker from "./portrait_container_setup";
import Tools from "./Tools";


export default class _TheatrePixiContainerFactory {

    theatre: Theatre;
    portrait_container_setup: TheatrePortraitContainerSetupWorker;

    constructor(theatre: Theatre,
        portrait_container_setup: TheatrePortraitContainerSetupWorker) {
        this.theatre = theatre;
        this.portrait_container_setup = portrait_container_setup;
    }

    /**
     * Create, and track the PIXIContainer for the provided image source within
     * our dock canvas
     *
     * @params imgPath (String) : The path of the image to initialize with when
     *							creating the PIXIContainer.
     * @params portName (String) : The name label for the insert in the container.
     * @params imgId (String) : The theatreId for this container.
     * @params optAlign (String) : The optAlign parameter denoting the insert's alignment.
     * @params emotes (Object) : An Object containing properties pretaining to the emote state
     *						   to initialize the container with.
     * @params isLeft (Boolean) : Boolean to determine if this portrait should be injected
     *							left, or right in the dock after creation. 
     *
     */
    createPortraitPIXIContainer(
        imgPath: string,
        portName: string,
        imgId: string,
        optAlign: string,
        emotions: EmotionDefinition,
        isLeft: boolean): void {


        // track the dockContainer
        if (this.theatre.stage.getInsertById(imgId)) {
            // this.context dockContainer should be destroyed
            console.log("PRE-EXISTING PIXI CONTAINER FOR %s ", imgId);
            this.theatre._destroyPortraitDock(imgId);
        }

        // given an image, we will generate a PIXI container to add to the theatreDock and size
        // it to the image loaded
        const dockContainer = new PIXI.Container();
        this.theatre.stage.pixiApplication.stage.addChild(dockContainer);

        const portrait = new Portrait(this.theatre.stage);
        dockContainer.addChild(portrait.root)

        //console.log("Creating PortraintPIXIContainer with emotions: ",emotions); 

        let ename: string, textFlyin, textStanding, textFont, textSize, textColor
        if (emotions) {
            ename = emotions.emote;
            textFlyin = emotions.textFlyin;
            textStanding = emotions.textStanding;
            textFont = emotions.textFont;
            textSize = emotions.textSize;
            textColor = emotions.textColor;
        }

        const typingBubble = this.newTypingBubble();
        const label = this.newLabel(portName);

        dockContainer.addChild(typingBubble);
        dockContainer.addChild(label)

        const emotion: EmotionDefinition = {
            emote: ename,
            textFlyin: textFlyin,
            textStanding: textStanding,
            textFont: textFont,
            textSize: textSize,
            textColor: textColor,
        }

        const insert = new StageInsert(this.theatre);
        insert.imgId = imgId;
        insert.dockContainer = dockContainer;
        insert.name = portName;
        insert.emotion = emotion;
        insert.portrait = portrait;
        insert.label = label;
        insert.typingBubble = typingBubble;
        insert.exitOrientation = (isLeft ? "left" : "right");
        insert.nameOrientation = "left";
        insert.optAlign = optAlign;
        insert.tweens = {};
        insert.order = 0;
        insert.renderOrder = 0;
        insert.meta = {}

        this.theatre.stage.stageInserts.push(insert);

        let imgSrcs = [];

        imgSrcs.push({ imgpath: "modules/theatre/app/graphics/typing.png", resname: "modules/theatre/app/graphics/typing.png" });
        imgSrcs.push({ imgpath: imgPath, resname: imgPath });
        if (Theatre.DEBUG) console.log("Adding %s with src %s", portName, imgPath);
        // get actor, load all emote images
        let actorId = imgId.replace("theatre-", "");
        let params: Params = Tools.getInsertParamsFromActorId(actorId);

        if (!params) {
            console.log("ERROR: Actor does not exist for %s", actorId);
            this.theatre._destroyPortraitDock(imgId);
            return null;
        }
        // load all rigging assets
        let rigResources: RiggingResource[] = ActorExtensions.getRiggingResources(actorId);

        if (Theatre.DEBUG) console.log("RigResources for %s :", portName, rigResources);

        for (let rigResource of rigResources)
            imgSrcs.push({ imgpath: rigResource.path, resname: rigResource.path });

        // load all emote base images + rigging for the emotes
        for (let emName in params.emotes)
            if (params.emotes[emName])
                if (params.emotes[emName].insert && params.emotes[emName].insert != "")
                    imgSrcs.push({ imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert });

        // handles the waiting game of grabbing loader for us
        this.theatre._addSpritesToPixi(imgSrcs, (loader, resources) => {
            // PIXI Container is ready!
            // Setup the dockContainer to display the base insert
            if (Theatre.DEBUG) console.log("Sprites added to PIXI createPortraitPIXIContainer", resources);
            let portWidth = (ename && params.emotes[ename] && params.emotes[ename].insert) ?
                resources[params.emotes[ename].insert].texture.width : resources[imgPath].texture.width;
            let initX = isLeft ? (-1 * portWidth) : (this.theatre.stage.theatreDock.offsetWidth + portWidth);

            if (!ename) {
                // load in default portrait
                dockContainer.x = initX;
                this.portrait_container_setup.setupPortraitContainer(imgId, optAlign, imgPath, resources, true);
            } else {
                // load in the ename emote portrait instead if possible, else load the default
                if (params.emotes[ename] && params.emotes[ename].insert) {
                    dockContainer.x = isLeft ?
                        (-1 * portWidth) : (this.theatre.stage.theatreDock.offsetWidth + portWidth);
                    this.portrait_container_setup.setupPortraitContainer(imgId, optAlign, params.emotes[ename].insert, resources, true);
                } else {
                    dockContainer.x = initX;
                    this.portrait_container_setup.setupPortraitContainer(imgId, optAlign, imgPath, resources, true);
                }
            }

        });
    }
    newTypingBubble() {
        const typingBubble = new PIXI.Sprite();

        typingBubble.width = 55;
        typingBubble.height = 55;
        typingBubble.theatreComponentName = "typingBubble";
        typingBubble.alpha = 0;

        return typingBubble;
    }

    newLabel(name: string) {
        // setup label if not setup
        const textStyle = new PIXI.TextStyle({
            align: "center",
            fontFamily: TheatreSettings.getTitleFont(),
            fontSize: 44,
            lineHeight: 64,
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
        const label = new PIXI.Text(name, textStyle);

        label.theatreComponentName = "label";

        label.x = 20;

        return label;
    }
}

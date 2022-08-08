
class _TheatrePixiContainerFactory {

    constructor(context,
        workers){
        this.context = context;
        this.workers = workers;
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
    createPortraitPIXIContainer(imgPath, portName, imgId, optAlign, emotions, isLeft) {
        // given an image, we will generate a PIXI container to add to the theatreDock and size
        // it to the image loaded
        let dockContainer = new PIXI.Container();
        let portraitContainer = new PIXI.Container();
        dockContainer.addChild(portraitContainer);
        // initial positioning
        portraitContainer.x = 0;
        portraitContainer.y = 0;

        let app = this.context.pixiCTX;
        app.stage.addChild(dockContainer);

        // track the dockContainer
        if (this.context.getInsertById(imgId)) {
            // this.context dockContainer should be destroyed
            console.log("PRE-EXISTING PIXI CONTAINER FOR %s ", imgId);
            this.context._destroyPortraitDock(imgId);
        }

        //console.log("Creating PortraintPIXIContainer with emotions: ",emotions); 

        let ename, textFlyin, textStanding, textFont, textSize, textColor
        if (emotions) {
            ename = emotions.emote;
            textFlyin = emotions.textFlyin;
            textStanding = emotions.textStanding;
            textFont = emotions.textFont;
            textSize = emotions.textSize;
            textColor = emotions.textColor;
        }

        this.context.portraitDocks.push({
            imgId: imgId,
            dockContainer: dockContainer,
            name: portName,
            emote: ename,
            textFlyin: textFlyin,
            textStanding: textStanding,
            textFont: textFont,
            textSize: textSize,
            textColor: textColor,
            portraitContainer: portraitContainer,
            portrait: null,
            label: null,
            typingBubble: null,
            exitOrientation: (isLeft ? "left" : "right"),
            nameOrientation: "left",
            mirrored: false,
            optAlign: optAlign,
            tweens: {},
            order: 0,
            renderOrder: 0,
            meta: {}
        });

        let imgSrcs = [];

        imgSrcs.push({ imgpath: "modules/theatre/app/graphics/typing.png", resname: "modules/theatre/app/graphics/typing.png" });
        imgSrcs.push({ imgpath: imgPath, resname: imgPath });
        if (Theatre.DEBUG) console.log("Adding %s with src %s", portName, imgPath);
        // get actor, load all emote images
        let actorId = imgId.replace("theatre-", "");
        let params = this.context._getInsertParamsFromActorId(actorId);

        if (!params) {
            console.log("ERROR: Actor does not exist for %s", actorId);
            this.context._destroyPortraitDock(imgId);
            return null;
        }
        // load all rigging assets
        let rigResources = Theatre.getActorRiggingResources(actorId);

        if (Theatre.DEBUG) console.log("RigResources for %s :", portName, rigResources);

        for (let rigResource of rigResources)
            imgSrcs.push({ imgpath: rigResource.path, resname: rigResource.path });

        // load all emote base images + rigging for the emotes
        for (let emName in params.emotes)
            if (params.emotes[emName])
                if (params.emotes[emName].insert && params.emotes[emName].insert != "")
                    imgSrcs.push({ imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert });

        // handles the waiting game of grabbing loader for us
        this.context._addSpritesToPixi(imgSrcs, (loader, resources) => {
            // PIXI Container is ready!
            // Setup the dockContainer to display the base insert
            if (Theatre.DEBUG) console.log("Sprites added to PIXI _createPortraitPIXIContainer", resources);
            let portWidth = (ename && params.emotes[ename] && params.emotes[ename].insert) ?
                resources[params.emotes[ename].insert].texture.width : resources[imgPath].texture.width;
            let initX = isLeft ? (-1 * portWidth) : (this.context.theatreDock.offsetWidth + portWidth);

            if (!ename) {
                // load in default portrait
                dockContainer.x = initX;
                this.workers.portrait_container_setup_worker.setupPortraitContainer(imgId, optAlign, imgPath, resources, true);
            } else {
                // load in the ename emote portrait instead if possible, else load the default
                if (params.emotes[ename] && params.emotes[ename].insert) {
                    dockContainer.x = isLeft ?
                        (-1 * portWidth) : (this.context.theatreDock.offsetWidth + portWidth);
                    this.portrait_container_setup_worker.setupPortraitContainer(imgId, optAlign, params.emotes[ename].insert, resources, true);
                } else {
                    dockContainer.x = initX;
                    this.portrait_container_setup_worker.setupPortraitContainer(imgId, optAlign, imgPath, resources, true);
                }
            }

        });
    }
}
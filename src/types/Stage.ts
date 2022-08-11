import TheatreSettings from "../extensions/settings.js";
import Theatre from "../Theatre.js";
import KHelpers from "../workers/KHelpers.js";
import getTheatreId from "../workers/Tools.js";
import Portrait from "./Portrait.js";
import StageInsert from "./StageInsert.js"
import TheatreActor from "./TheatreActor.js"
import TheatreStyle from "./TheatreStyle.js";

export default class Stage {

    /**
     * Actors by theatre-id
     */
    actors: Map<string, TheatreActor>;
    stageInserts: StageInsert[];
    theatreDock: HTMLCanvasElement;
    pixiApplication: PIXI.Application;
    theatreBar: HTMLDivElement;

    constructor() {
        this.actors = new Map();
        this.stageInserts = [];

    }


    init(){

        this.theatreBar = document.createElement("div");
        this.theatreBar.id = "theatre-bar";
        KHelpers.addClass(this.theatreBar, "theatre-bar");

        let barContainerPrime = document.createElement("div");
		let barContainerSecond = document.createElement("div");

		barContainerPrime.id = "theatre-prime-bar";
		barContainerSecond.id = "theatre-second-bar";

		KHelpers.addClass(barContainerPrime, "theatre-bar-left");
		KHelpers.addClass(barContainerSecond, "theatre-bar-right");

		this.theatreBar.appendChild(barContainerPrime);
		this.theatreBar.appendChild(barContainerSecond);
    }
    
    /**
     * Create the initial dock canvas, future 'portraits'
     * will be PIXI containers whom are sized to the portraits
     * that they contain.
     *
     * @return (HTMLElement) : The canvas HTMLElement of the created PIXI Canvas,
     *						  or null if unsuccessful. 
     */
    initTheatreDockCanvas() {
        // get theatreDock, and an initialize the canvas
        // no need to load in any resources as that will be done on a per-diem bases
        // by each container portrait

        this.pixiApplication = new PIXI.Application({
            transparent: true,
            antialias: true,
            width: document.body.offsetWidth
        });

        this.theatreDock = this.pixiApplication.view;

        if (!this.theatreDock) {
            ui.notifications.error(game.i18n.localize("Theatre.UI.Notification.Fatal"));
            throw "FAILED TO INITILIZE DOCK CANVAS!";
        }


        this.theatreDock.id = "theatre-dock";
        KHelpers.addClass(this.theatreDock, "theatre-dock");
        KHelpers.addClass(this.theatreDock, "no-scrollbar");

        // turn off ticker
        this.pixiApplication.ticker.autoStart = false;
        this.pixiApplication.ticker.stop();

        return canvas;
    }

    applyStyle(theatreStyle: string) {
        switch (theatreStyle) {
            case TheatreStyle.LIGHTBOX:
            case TheatreStyle.CLEARBOX:
                this.theatreDock.style.height = "100%";
            case TheatreStyle.MANGABUBBLE:
                throw "NotImplemented";
            case TheatreStyle.TEXTBOX:
            default:
                this.theatreDock.style.height = "99.5vh";
        }

    }

    removeInsertById(
        theatreId: string,
        remote?: boolean) {

        const toRemoveInsert = this.getInsertBy(insert => insert.imgId == theatreId && !insert.deleting);

        const textBoxFilter =
            (textBox: HTMLElement) =>
                textBox.getAttribute("imgId") == theatreId && !textBox.getAttribute("deleting");

        const toRemoveTextBox: HTMLElement = Theatre.instance._getTextBoxes().filter(textBoxFilter);

        toRemoveInsert.deleting = true;

        if (toRemoveInsert && !toRemoveTextBox ||
            !toRemoveInsert && toRemoveTextBox)
            console.error("Illegal Program State")

        if (!toRemoveInsert || !toRemoveTextBox)
            return null;

        return Theatre.instance._removeInsert(
            toRemoveInsert,
            toRemoveTextBox,
            remote);
    }

    /**
     * @private
     */
    _getInsertToRemove() {

    }

    getInsertByName(name: string): StageInsert {
        return this.getInsertBy(dock => dock.name == name);
    }

    getInsertById(theatreId: string): StageInsert {
        return this.getInsertBy(dock => dock.imgId == theatreId);
    }

    getInsertBy(filter: (dock: StageInsert) => boolean): StageInsert {

        for (let idx = this.stageInserts.length - 1; idx >= 0; --idx) {

            const portraitDock = this.stageInserts[idx];

            // WMW: I don't know why this is there, I just found it roughly like so..
            if (!this.stageInserts[idx].dockContainer) {
                this.stageInserts.splice(idx, 1);
                console.error(`Illegal Portrait Dock state for ${portraitDock.imgId}`)
                continue;
            }

            const itHit = filter(portraitDock);

            if (itHit)
                return portraitDock;
        }

        return undefined;
    }

    removeActorFromStage(theatreActorId: string) {
        this.removeInsertById(theatreActorId);
        this.actors.delete(theatreActorId);
    }

    /**
     * Returns whether the actor is on the stage.
     * @params actor (Actor) : The actor. 
     */
    isActorStaged(actor: Actor) {
        if (!actor)
            return false;

        return this.actors.has(getTheatreId(actor));
    }

    handleWindowResize() {


        let dockWidth = this.theatreDock.offsetWidth;
        let dockHeight = this.theatreDock.offsetHeight;

        this.theatreDock.setAttribute("width", dockWidth.toString());
        this.theatreDock.setAttribute("height", dockHeight.toString());

        this.pixiApplication.renderer.view.width = dockWidth;
        this.pixiApplication.renderer.view.height = dockHeight;

        this.maybeReapplyRelativePortraitSize();

        this.pixiApplication.renderer.resize(dockWidth, dockHeight);
        // TODO update size of portraits, now that they support relative heights
    }

    maybeReapplyRelativePortraitSize() {

        const imageSizeStr: string = TheatreSettings.getTheatreImageSize();
        if (!imageSizeStr.endsWith("%"))
            return; // no-op

        for (const insert of this.stageInserts) {
            new Portrait(this, insert).updatePortraitDimensions();
        }
    }
}
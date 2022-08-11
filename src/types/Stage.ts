import Theatre from "../Theatre.js";
import KHelpers from "../workers/KHelpers.js";
import getTheatreId from "../workers/Tools.js";
import PortraitDock from "./PortraitDock.js"
import TheatreActor from "./TheatreActor.js"
import TheatreStyle from "./TheatreStyle.js";

export default class Stage {

    actors: Map<string, TheatreActor>;

    portraitDocks: PortraitDock[];
    theatreDock: HTMLCanvasElement;
    pixiApplication: PIXI.Application;

    constructor() {
        this.actors = new Map();
        this.portraitDocks = [];
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

    /**
     * Removes insert by ID
     *
     * @params id (String) : The theatreId of the insert to remove.
     * @params remote (Boolean) : Boolean indicating if this is being invoked remotely, or locally. 
     *
     * @return (Object) : An object containing the items that were removed {insert : (Object), textBox: (HTMLElement)}
     *					 or null if there was nothing to remove. 
     */
    removeInsertById(
        imgId: string,
        remote?: boolean) {

        let toRemoveInsert: PortraitDock;
        let toRemoveTextBox: HTMLElement;

        for (const insert of this.portraitDocks) {
            if (insert.imgId == imgId && !insert.deleting) {
                insert.deleting = true;
                toRemoveInsert = insert;
                break;
            }
        }

        for (const textBox of Theatre.instance._getTextBoxes()) {
            if (textBox.getAttribute("imgId") == imgId && !textBox.getAttribute("deleting")) {
                textBox.setAttribute("deleting", "true");
                toRemoveTextBox = <HTMLElement>textBox;
                break;
            }
        }

        if (toRemoveInsert && !toRemoveTextBox ||
            !toRemoveInsert && toRemoveTextBox)
            logger.error("TODO")

        if (!toRemoveInsert || !toRemoveTextBox)
            return null;

        return Theatre.instance._removeInsert(
            toRemoveInsert,
            toRemoveTextBox,
            remote);
    }

    getInsertByName(name: string): PortraitDock {
        return this.getInsertBy(dock => dock.name == name);
    }

    getInsertById(theatreId: string): PortraitDock {
        return this.getInsertBy(dock => dock.imgId == theatreId);
    }

    getInsertBy(filter: (dock: PortraitDock) => boolean): PortraitDock {

        for (let idx = this.portraitDocks.length - 1; idx >= 0; --idx) {

            const portraitDock = this.portraitDocks[idx];

            // WMW: I don't know why this is there, I just found it roughly like so..
            if (!this.portraitDocks[idx].dockContainer) {
                this.portraitDocks.splice(idx, 1);
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

        this.pixiApplication.renderer.resize(dockWidth, dockHeight);

        // TODO update size of portraits, now that they support relative heights
    }
}
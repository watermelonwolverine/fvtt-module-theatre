import Theatre from "../Theatre.js";
import KHelpers from "../workers/KHelpers.js";
import getTheatreId from "../workers/Tools.js";
import PortraitDock from "./PortraitDock.js"
import TheatreActor from "./TheatreActor.js"
import TheatreStyle from "./TheatreStyle.js";

export default class Stage {

    actors: {
        [key: string]: TheatreActor
    };

    portraitDocks: PortraitDock[];
    theatreDock: HTMLCanvasElement;
    pixiCTX: PIXI.Application;

    constructor() {
        this.actors = {};
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

        let app = new PIXI.Application({
            transparent: true,
            antialias: true,
            width: document.body.offsetWidth
        });

        let canvas = app.view;

        if (!canvas) {
            ui.notifications.error(game.i18n.localize("Theatre.UI.Notification.Fatal"));
            throw "FAILED TO INITILIZE DOCK CANVAS!";
        }

        this.theatreDock = canvas;
        this.pixiCTX = app;

        this.theatreDock.id = "theatre-dock";
        KHelpers.addClass(this.theatreDock, "theatre-dock");
        KHelpers.addClass(this.theatreDock, "no-scrollbar");

        // turn off ticker
        app.ticker.autoStart = false;
        app.ticker.stop();

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

    removeActorFromStage(theatreActorId: string) {
        this.removeInsertById(theatreActorId);
        delete this.actors[theatreActorId];
    }

    /**
     * Returns whether the actor is on the stage.
     * @params actor (Actor) : The actor. 
     */
    isActorStaged(actor: Actor) {
        if (!actor)
            throw "NullPointerException";
            
        return this.actors[getTheatreId(actor)]
    }
}
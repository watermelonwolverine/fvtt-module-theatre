import TheatreSettings from "../extensions/settings";
import Theatre from "../Theatre";
import KHelpers from "../workers/KHelpers";
import Tools from "../workers/Tools";
import Portrait from "./Portrait";
import StageInsert from "./StageInsert.js"
import TheatreActor from "./TheatreActor.js"
import TheatreStyle from "./TheatreStyle";

export default class Stage {

    /**
     * Actors by theatre-id
     */
    actors: Map<string, TheatreActor>;
    stageInserts: StageInsert[];

    // after init
    theatreDock?: HTMLCanvasElement;
    pixiApplication?: PIXI.Application;
    theatreBar?: HTMLDivElement;
    primeBar?: HTMLDivElement;
    secondBar?: HTMLDivElement;


    constructor() {
        this.actors = new Map();
        this.stageInserts = [];

    }


    init() {

        this.theatreBar = document.createElement("div");
        this.theatreBar.id = "theatre-bar";
        KHelpers.addClass(this.theatreBar, "theatre-bar");

        this.primeBar = document.createElement("div");
        this.secondBar = document.createElement("div");

        this.primeBar.id = "theatre-prime-bar";
        this.secondBar.id = "theatre-second-bar";

        KHelpers.addClass(this.primeBar, "theatre-bar-left");
        KHelpers.addClass(this.secondBar, "theatre-bar-right");

        this.theatreBar.appendChild(this.primeBar);
        this.theatreBar.appendChild(this.secondBar);
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
        remote?: boolean): void {

        const toRemoveInsert = this.getInsertBy(insert => insert.imgId == theatreId && !insert.deleting);

        const textBoxFilter =
            (textBox: HTMLElement) =>
                textBox.getAttribute("imgId") == theatreId && !textBox.getAttribute("deleting");

        const toRemoveTextBox: HTMLElement = this.getTextBoxes().find(textBoxFilter);

        if (!toRemoveInsert || !toRemoveTextBox)
            return; // no-op

        toRemoveInsert.deleting = true;

        Theatre.instance._removeInsert(
            toRemoveInsert,
            toRemoveTextBox,
            remote);
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

        return this.actors.has(Tools.getTheatreId(actor));
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
            return; // absolute values were set, so no dynamic resizing needed

        this.updatePortraitSizes();
    }

    updatePortraitSizes() {
        for (const insert of this.stageInserts) {
            const portrait = new Portrait(this, insert);
            portrait.updatePortrait();
        }

        if (!Theatre.instance.rendering)
            Theatre.instance._renderTheatre(performance.now());
    }


    getTextBoxes(): HTMLElement[] {
        let textBoxes = [];
        for (let container of this.theatreBar.children)
            for (let textBox of container.children)
                textBoxes.push(<HTMLElement>textBox);
        return textBoxes;
    }

    getTextBoxById(theatreId: string): HTMLElement {
        return this.getTextBoxes().find(e => { return e.getAttribute("imgId") == theatreId });
    }

    getTextBoxByName(name: string) {
        return this.getTextBoxes().find(e => { return e.getAttribute("name") == name });
    }
}
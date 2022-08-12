/* eslint-disable no-unused-vars */
import TheatreSettings from "../extensions/settings";
import Theatre from "../Theatre";
import TheatreStyle from "../types/TheatreStyle";
import KHelpers from "./KHelpers";
import _TheatreWorkers from "./workers";

export default class _TextBoxFactory {

    workers: _TheatreWorkers;
    context: Theatre;

    constructor(context: Theatre,
        workers: _TheatreWorkers) {
        this.context = context;
        this.workers = workers;
    }


    create_textbox(
        portName: string,
        imgId: string) {

        const textBox = document.createElement("div");
        // textBox class + style depends on our display mode
        switch (TheatreSettings.getTheatreStyle()) {
            case TheatreStyle.LIGHTBOX:
                KHelpers.addClass(textBox, "theatre-text-box-light");
                break;
            case TheatreStyle.CLEARBOX:
                KHelpers.addClass(textBox, "theatre-text-box-clear");
                break;
            case TheatreStyle.MANGABUBBLE:
                break;
            case TheatreStyle.TEXTBOX:
            default:
                KHelpers.addClass(textBox, "theatre-text-box");
                break;
        }
        KHelpers.addClass(textBox, "no-scrollbar");

        portName = portName.toLowerCase();

        textBox.setAttribute('name', portName);
        textBox.setAttribute("imgid", imgId);
        textBox.style.opacity = "0";

        this.context.applyFontFamily(textBox, this.context.textFont);

        textBox.addEventListener("mousedown", (ev) => this.handleTextBoxMouseDown(ev));
        textBox.addEventListener("mouseup", (ev) => this.handleTextBoxMouseUp(ev));
        textBox.addEventListener("dblclick", (ev) => this.handleTextBoxMouseDoubleClick(ev));

        return textBox;
    }

    /**
     * Handle textBox MouseDown
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleTextBoxMouseDown(ev: MouseEvent) {
        if (Theatre.DEBUG) console.log("MOUSE DOWN ", ev.buttons, ev.button);
        let id = (ev.currentTarget as HTMLElement).getAttribute("imgId");

        if (ev.button == 0) {
            if (!ev.ctrlKey
                && !ev.shiftKey
                && !ev.altKey) {
                // if old dragPoint exists reset the style, and clear any interval that may exist
                if (!!this.context.dragPoint && !!this.context.dragPoint.insert) {
                    console.log("PREXISTING DRAGPOINT!");
                    //this.context.dragPoint.port.style.transition = "top 0.5s ease, left 0.5s ease, transform 0.5s ease"; 
                }
                // calculate bouding box
                let boundingBox: { [key: string]: number } = {};
                let insert = this.context.stage.getInsertById(id);

                // permission check
                if (!this.context.isActorOwner(game.user.id, insert.imgId)) {
                    ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
                    return;
                }

                // max top is half natural height
                // min top is zero to prevent it from losing it's flush
                // max left is half natural width
                // min left is - half natural width
                boundingBox["maxtop"] = (insert.optAlign == "top" ? 0 : insert.portrait.height);
                boundingBox["mintop"] = insert.portrait.height / 2;
                boundingBox["maxleft"] = insert.portrait.width * 3 / 2;
                boundingBox["minleft"] = 0;

                // original cooords
                //let portStyles = KHelpers.style(port); 
                let origX = insert.portraitContainer.x;
                let origY = insert.portraitContainer.y;

                if (Theatre.DEBUG) console.log("STORING DRAG POINT", ev.clientX || ev.pageX, ev.clientY || ev.pageY, boundingBox, origX, origY);

                // change the transition style while we're dragging
                //port.style.transition = "top 0.5s ease, left 0.5s ease, transform 0.5s ease"; 

                // normal mouse down, start "drag" tracking
                this.context.dragPoint = {
                    otop: origY,
                    oleft: origX,
                    ix: (ev.clientX || ev.pageX),
                    iy: (ev.clientY || ev.pageY),
                    insert: insert,
                    box: boundingBox,
                }
                // bind listeners
                window.removeEventListener("mouseup", this.context.handleWindowMouseUp);
                window.addEventListener("mouseup", this.context.handleWindowMouseUp);
                ev.stopPropagation();
            }
        } else if (ev.button == 2) {
            this.context.swapTarget = id;
            ev.stopPropagation();
        }
    }


    /**
     * Handle textBox Mouse Double Click
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleTextBoxMouseDoubleClick(ev: MouseEvent) {
        if (Theatre.DEBUG) console.log("MOUSE DOUBLE CLICK");
        let id = (ev.currentTarget as HTMLElement).getAttribute("imgId");
        this.context.resetInsertById(id);
    }

    /**
     * Handle textBox mouse up
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleTextBoxMouseUp(ev: MouseEvent) {
        if (Theatre.DEBUG) console.log("MOUSE UP ", ev.buttons, ev.button);
        let id = (ev.currentTarget as HTMLElement).getAttribute("imgId");
        let chatMessage = document.getElementById("chat-message");
        if (ev.button == 0) {
            if (ev.ctrlKey) {
                this.context.decayTextBoxById(id);
                ev.stopPropagation();
            } else if (ev.shiftKey) {
                this.context.pushInsertById(id, true);
                chatMessage.focus();
                ev.stopPropagation();
            } else if (ev.altKey) {
                // activate navitem
                // activate insert
                this.context.activateInsertById(id, ev);
            }
        } else if (ev.button == 2) {
            if (ev.ctrlKey) {
                this.context.stage.removeInsertById(id);
                ev.stopPropagation();
            } else if (ev.shiftKey) {
                if (this.context.swapTarget
                    && this.context.swapTarget != id) {
                    this.context.swapInsertsById(id, this.context.swapTarget);
                    this.context.swapTarget = null;
                } else {
                    this.context.pushInsertById(id, false);
                }
                chatMessage.focus();
                ev.stopPropagation();
            } else if (ev.altKey) {
                let actor = game.actors.get(id.replace("theatre-", ""));
                this.context.addToNavBar(actor.data);
            } else if (this.context.swapTarget) {
                if (this.context.swapTarget != id) {
                    //this.context.swapInsertsById(id,this.context.swapTarget); 
                    this.context.moveInsertById(id, this.context.swapTarget);
                    this.context.swapTarget = null;
                } else {
                    this.context.mirrorInsertById(id);
                }
                ev.stopPropagation();
                chatMessage.focus();
                this.context.swapTarget = null;
            }
        }
    }
}
class _TextBoxFactory {

    /**
     * @param {Theatre} context
     * @param {_TheatreWorkers} workers
     */
    constructor(context,
        workers) {
        this.context = context;
        this.workers = workers;
    }

    /**
     * @param {string} portName
     * @param {string} imgId
     */
    create_textbox(
        portName,
        imgId) {

        const textBox = document.createElement("div");
        // textBox class + style depends on our display mode
        switch (this.context.settings.theatreStyle) {
            case "lightbox":
                KHelpers.addClass(textBox, "theatre-text-box-light");
                break;
            case "clearbox":
                KHelpers.addClass(textBox, "theatre-text-box-clear");
                break;
            case "mangabubble":
                break;
            case "textbox":
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

        textBox.addEventListener("mousedown", this.handleTextBoxMouseDown);
        textBox.addEventListener("mouseup", this.handleTextBoxMouseUp);
        textBox.addEventListener("dblclick", this.handleTextBoxMouseDoubleClick);

        return textBox;
    }

    /**
     * Handle textBox MouseDown
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleTextBoxMouseDown(ev) {
        if (Theatre.DEBUG) console.log("MOUSE DOWN ", ev.buttons, ev.button);
        let id = ev.currentTarget.getAttribute("imgId");

        if (ev.button == 0) {
            if (!ev.ctrlKey
                && !ev.shiftKey
                && !ev.altKey) {
                // if old dragPoint exists reset the style, and clear any interval that may exist
                if (!!Theatre.instance.dragPoint && !!Theatre.instance.dragPoint.insert) {
                    console.log("PREXISTING DRAGPOINT!");
                    //Theatre.instance.dragPoint.port.style.transition = "top 0.5s ease, left 0.5s ease, transform 0.5s ease"; 
                }
                // calculate bouding box
                let boundingBox = {};
                let insert = Theatre.instance.getInsertById(id);

                // permission check
                if (!Theatre.instance.isActorOwner(game.user.id, insert.imgId)) {
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

                if (Theatre.DEBUG) console.log("STORING DRAG POINT", ev.clientX || ev.pageX, ev.clientY || ev.PageY, boundingBox, origX, origY);

                // change the transition style while we're dragging
                //port.style.transition = "top 0.5s ease, left 0.5s ease, transform 0.5s ease"; 

                // normal mouse down, start "drag" tracking
                Theatre.instance.dragPoint = {
                    otop: origY,
                    oleft: origX,
                    ix: (ev.clientX || ev.pageX),
                    iy: (ev.clientY || ev.pageY),
                    insert: insert,
                    box: boundingBox,
                }
                // bind listeners
                window.removeEventListener("mouseup", Theatre.instance.handleWindowMouseUp);
                window.addEventListener("mouseup", Theatre.instance.handleWindowMouseUp);
                ev.stopPropagation();
            }
        } else if (ev.button == 2) {
            Theatre.instance.swapTarget = id;
            ev.stopPropagation();
        }
    }


    /**
     * Handle textBox Mouse Double Click
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleTextBoxMouseDoubleClick(ev) {
        if (Theatre.DEBUG) console.log("MOUSE DOUBLE CLICK");
        let id = ev.currentTarget.getAttribute("imgId");
        Theatre.instance.resetInsertById(id);
    }

    /**
     * Handle textBox mouse up
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleTextBoxMouseUp(ev) {
        if (Theatre.DEBUG) console.log("MOUSE UP ", ev.buttons, ev.button);
        let id = ev.currentTarget.getAttribute("imgId");
        let chatMessage = document.getElementById("chat-message");
        if (ev.button == 0) {
            if (ev.ctrlKey) {
                Theatre.instance.decayTextBoxById(id);
                ev.stopPropagation();
            } else if (ev.shiftKey) {
                Theatre.instance.pushInsertById(id, true);
                chatMessage.focus();
                ev.stopPropagation();
            } else if (ev.altKey) {
                // activate navitem
                // activate insert
                Theatre.instance.activateInsertById(id, ev);
            }
        } else if (ev.button == 2) {
            if (ev.ctrlKey) {
                Theatre.instance.removeInsertById(id);
                ev.stopPropagation();
            } else if (ev.shiftKey) {
                if (Theatre.instance.swapTarget
                    && Theatre.instance.swapTarget != id) {
                    Theatre.instance.swapInsertsById(id, Theatre.instance.swapTarget);
                    Theatre.instance.swapTarget = null;
                } else {
                    Theatre.instance.pushInsertById(id, false);
                }
                chatMessage.focus();
                ev.stopPropagation();
            } else if (ev.altKey) {
                let actor = game.actors.get(id.replace("theatre-", ""));
                Theatre.addToNavBar(actor.data);
            } else if (Theatre.instance.swapTarget) {
                if (Theatre.instance.swapTarget != id) {
                    //Theatre.instance.swapInsertsById(id,Theatre.instance.swapTarget); 
                    Theatre.instance.moveInsertById(id, Theatre.instance.swapTarget);
                    Theatre.instance.swapTarget = null;
                } else {
                    Theatre.instance.mirrorInsertById(id);
                }
                ev.stopPropagation();
                chatMessage.focus();
                Theatre.instance.swapTarget = null;
            }
        }
    }
}
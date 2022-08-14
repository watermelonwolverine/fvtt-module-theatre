import Theatre from "../Theatre";
import StageInsert from "../types/StageInsert";

type DragPoint = {
    dragStartX: number,
    dragStartY: number,
    insert: StageInsert
}

export default class TextBoxMouseEventHandler {

    dragPoint: DragPoint;
    swapTarget: string;
    theatre: Theatre;

    windowMouseButtonUpHandler = (ev: MouseEvent) => this.handleWindowMouseUp(ev);

    constructor(theatre: Theatre) {
        this.theatre = theatre;
    }

    addListeners(textBox: HTMLElement) {
        textBox.addEventListener("mousedown", (ev) => this.handleTextBoxMouseDown(ev));
        textBox.addEventListener("mouseup", (ev) => this.handleTextBoxMouseUp(ev));
        textBox.addEventListener("dblclick", (ev) => this.handleTextBoxMouseDoubleClick(ev));
    }

    /**
    * Handle textBox MouseDown
    *
    * @param ev (Event) : The Event that triggered this handler
    */
    handleTextBoxMouseDown(ev: MouseEvent) {
        if (ev.button == 0) {
            this.handleLMBDown(ev);
        } else if (ev.button == 2) {
            this.handleRMBDown(ev);
        }
    }

    handleLMBDown(ev: MouseEvent) {

        if (ev.ctrlKey
            || ev.shiftKey
            || ev.altKey)
            return; // no-op

        let id = (ev.currentTarget as HTMLElement).getAttribute("imgId");

        // if old dragPoint exists reset the style, and clear any interval that may exist
        if (!!this.dragPoint && !!this.dragPoint.insert) {
            console.log("PREXISTING DRAGPOINT!");
            //this.context.dragPoint.port.style.transition = "top 0.5s ease, left 0.5s ease, transform 0.5s ease"; 
        }

        let insert = this.theatre.stage.getInsertById(id);

        // permission check
        if (!this.theatre.isActorOwner(game.user.id, insert.imgId)) {
            ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
            return;
        }

        // original cooords
        //let portStyles = KHelpers.style(port); 
        let origX = insert.portrait.root.x;
        let origY = insert.portrait.root.y;

        // change the transition style while we're dragging
        //port.style.transition = "top 0.5s ease, left 0.5s ease, transform 0.5s ease"; 

        // normal mouse down, start "drag" tracking
        this.dragPoint = {
            dragStartX: (ev.clientX || ev.pageX),
            dragStartY: (ev.clientY || ev.pageY),
            insert: insert
        }
        // bind listeners
        window.removeEventListener("mouseup", this.windowMouseButtonUpHandler);
        window.addEventListener("mouseup", this.windowMouseButtonUpHandler);
        ev.stopPropagation();

    }

    handleRMBDown(ev: MouseEvent) {
        let id = (ev.currentTarget as HTMLElement).getAttribute("imgId");
        this.swapTarget = id;
        ev.stopPropagation();
    }

    /**
     * Handle textBox Mouse Double Click
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleTextBoxMouseDoubleClick(ev: MouseEvent) {
        if (Theatre.DEBUG) console.log("MOUSE DOUBLE CLICK");
        let id = (ev.currentTarget as HTMLElement).getAttribute("imgId");
        this.theatre.resetInsertById(id);
    }

    /**
     * Handle textBox mouse up
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleTextBoxMouseUp(ev: MouseEvent) {
        if (ev.button == 0) {
            this.handleLMBUp(ev);
        } else if (ev.button == 2) {
            this.handleRMBUp(ev);
        }
    }

    handleLMBUp(ev: MouseEvent) {
        let id = (ev.currentTarget as HTMLElement).getAttribute("imgId");
        let chatMessage = document.getElementById("chat-message");
        if (ev.ctrlKey) {
            // => CTRL + LMB
            this.theatre.decayTextBoxById(id);
            ev.stopPropagation();
        } else if (ev.shiftKey) {
            // => SHIFT + LMB
            this.theatre.pushInsertById(id, true);
            chatMessage.focus();
            ev.stopPropagation();
        } else if (ev.altKey) {
            // => ALT + LMB
            this.theatre.activateInsertById(id, ev);
        }
    }

    handleRMBUp(ev: MouseEvent) {
        let id = (ev.currentTarget as HTMLElement).getAttribute("imgId");
        let chatMessage = document.getElementById("chat-message");
        if (ev.ctrlKey) {
            this.theatre.stage.removeInsertById(id);
            ev.stopPropagation();
        } else if (ev.shiftKey) {
            if (this.swapTarget
                && this.swapTarget != id) {
                this.theatre.swapInsertsById(id, this.swapTarget);
                this.swapTarget = null;
            } else {
                this.theatre.pushInsertById(id, false);
            }
            chatMessage.focus();
            ev.stopPropagation();
        } else if (ev.altKey) {
            let actor = game.actors.get(id.replace("theatre-", ""));
            this.theatre.addToNavBar(actor.data);
        } else if (this.swapTarget) {
            if (this.swapTarget != id) {
                //this.context.swapInsertsById(id,this.context.swapTarget); 
                this.theatre.moveInsertById(id, this.swapTarget);
                this.swapTarget = null;
            } else {
                this.theatre.mirrorInsertById(id);
            }
            ev.stopPropagation();
            chatMessage.focus();
            this.swapTarget = null;
        }
    }

    /**
     * Handle window mouse up
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleWindowMouseUp(ev: MouseEvent) {

        const insert = this.dragPoint.insert;

        if (!insert.dockContainer || !insert.portrait) {
            console.log("ERROR: insert dockContainer or portrait is INVALID");
            window.removeEventListener("mouseup", this.windowMouseButtonUpHandler);
            return;
        }

        const finalX = this.calculateFinalLocalPosition(ev, insert);

        let tweenId = "portraitMove";
        let tween = TweenMax.to(insert.portrait, 0.5, {
            x: finalX,
            y: insert.portrait.y,
            ease: Power3.easeOut,
            onComplete: function (ctx, imgId, tweenId) {
                // decrement the rendering accumulator
                ctx._removeDockTween(imgId, this, tweenId);
                // remove our own reference from the dockContainer tweens
            },
            onCompleteParams: [Theatre.instance, insert.imgId, tweenId]
        });
        Theatre.instance._addDockTween(insert.imgId, tween, tweenId);

        // send sceneEvent
        Theatre.instance._sendSceneEvent("positionupdate", {
            insertid: insert.imgId,
            position: {
                x: finalX,
                y: insert.portrait.y,
                mirror: insert.portrait.mirrored
            }
        });

        window.removeEventListener("mouseup", this.windowMouseButtonUpHandler);
        this.dragPoint = null;
        // push focus to chat-message
        let chatMessage = document.getElementById("chat-message");
        chatMessage.focus();
    }

    calculateFinalLocalPosition(ev: MouseEvent,
        insert: StageInsert): number {
        let x = ev.clientX || ev.pageX;

        const portrait = insert.portrait;

        const deltaX = x - this.dragPoint.dragStartX;

        let finalX = portrait.x + deltaX;

        // global positions of bottom corners
        const bottomLeft = new PIXI.Point(0, 0);
        const bottomRight = new PIXI.Point(this.theatre.stage.width - portrait.width, 0);

        // bottom corners relative to parent
        const localBottomLeftX = portrait.root.parent.toLocal(bottomLeft).x;
        const localBottomRightX = portrait.root.parent.toLocal(bottomRight).x;

        // Don't let image out of canvas
        // don't overshoot to the left
        const minX = Math.max(
            localBottomLeftX,
            - portrait.width / 2);

        // don't overshoot to the right
        const maxX = Math.min(
            localBottomRightX,
            portrait.width / 2);

        finalX = finalX > maxX ? maxX : finalX;
        finalX = finalX < minX ? minX : finalX;

        return finalX;
    }
}
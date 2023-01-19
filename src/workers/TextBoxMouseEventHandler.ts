import Theatre from "../Theatre";
import type StageInsert from "../components/stage/StageInsert";
import type SceneEventProcessor from "./SceneEventProcessor";
import { SceneEventTypes } from "../types/SceneEventTypes";
import type Portrait from "src/components/stage/Portrait";

type DragPoint = {
	dragStartX: number;
	dragStartY: number;
	insert: StageInsert;
};

export default class TextBoxMouseEventHandler {
	// given
	theatre: Theatre;
	sceneEventProcessor: SceneEventProcessor;

	// context
	dragPoint: DragPoint | null;
	swapTarget: string | null;

	windowMouseButtonUpHandler = (ev: MouseEvent) => this.handleWindowMouseUp(ev);

	constructor(theatre: Theatre, sceneEventProcessor: SceneEventProcessor) {
		this.theatre = theatre;
		this.sceneEventProcessor = sceneEventProcessor;
	}

	addListeners(textBox: HTMLElement) {
		textBox.addEventListener("mousedown", (ev) => this.handleTextBoxMouseDown(ev));
		textBox.addEventListener("mouseup", (ev) => this.handleTextBoxMouseUp(ev));
		textBox.addEventListener("dblclick", (ev) => this.handleTextBoxMouseDoubleClick(ev));
	}

	handleTextBoxMouseDown(ev: MouseEvent) {
		if (ev.button == 0) {
			this.handleTextBoxLMBDown(ev);
		} else if (ev.button == 2) {
			this.handleTextBoxRMBDown(ev);
		}
	}

	handleTextBoxLMBDown(ev: MouseEvent) {
		if (ev.ctrlKey || ev.shiftKey || ev.altKey) return; // no-op

		let id = <string>(ev.currentTarget as HTMLElement).getAttribute("imgId");

		if (!!this.dragPoint && !!this.dragPoint.insert) {
			console.error("PREXISTING DRAGPOINT!");
		}

		let insert = <StageInsert>this.theatre.stage.getInsertById(id);

		// permission check
		if (!this.theatre.isActorOwner(<string>game.user?.id, insert.imgId)) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return;
		}

		this.dragPoint = {
			dragStartX: ev.clientX || ev.pageX,
			dragStartY: ev.clientY || ev.pageY,
			insert: insert,
		};

		window.removeEventListener("mouseup", this.windowMouseButtonUpHandler);
		window.addEventListener("mouseup", this.windowMouseButtonUpHandler);
		ev.stopPropagation();
	}

	handleTextBoxRMBDown(ev: MouseEvent) {
		let id = <string>(ev.currentTarget as HTMLElement).getAttribute("imgId");
		this.swapTarget = id;
		ev.stopPropagation();
	}

	handleTextBoxMouseDoubleClick(ev: MouseEvent) {
		let id = <string>(ev.currentTarget as HTMLElement).getAttribute("imgId");
		this.theatre.resetInsertById(id);
	}

	handleTextBoxMouseUp(ev: MouseEvent) {
		if (ev.button == 0) {
			this.handleTextBoxLMBUp(ev);
		} else if (ev.button == 2) {
			this.handleTextBoxRMBUp(ev);
		}
	}

	handleTextBoxLMBUp(ev: MouseEvent) {
		let id = <string>(ev.currentTarget as HTMLElement).getAttribute("imgId");
		let chatMessage = <HTMLElement>document.getElementById("chat-message");

		if (ev.ctrlKey) {
			this.theatre.decayTextBoxById(id);
			ev.stopPropagation();
		} else if (ev.shiftKey) {
			this.theatre.pushInsertById(id, true);
			chatMessage.focus();
			ev.stopPropagation();
		} else if (ev.altKey) {
			this.theatre.activateInsertById(id, ev);
		}
	}

	handleTextBoxRMBUp(ev: MouseEvent) {
		let id = <string>(ev.currentTarget as HTMLElement).getAttribute("imgId");
		let chatMessage = <HTMLElement>document.getElementById("chat-message");
		if (ev.ctrlKey) {
			this.theatre.stage.removeInsertById(id);
			ev.stopPropagation();
		} else if (ev.shiftKey) {
			if (this.swapTarget && this.swapTarget != id) {
				this.theatre.swapInsertsById(id, this.swapTarget);
				this.swapTarget = null;
			} else {
				this.theatre.pushInsertById(id, false);
			}
			chatMessage.focus();
			ev.stopPropagation();
		} else if (ev.altKey) {
			let actor = <Actor>game.actors?.get(id.replace("theatre-", ""));
			this.theatre.navBar.addToNavBar(actor);
		} else if (this.swapTarget) {
			if (this.swapTarget != id) {
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

	handleWindowMouseUp(ev: MouseEvent) {
		const insert = <StageInsert>this.dragPoint?.insert;

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
				ctx._removeDockTween(imgId, this, tweenId);
			},
			onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
		});
		Theatre.instance._addDockTween(insert.imgId, tween, tweenId);

		this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.positionupdate, {
			insertid: insert.imgId,
			position: {
				x: finalX,
				y: insert.portrait.y,
				mirror: insert.portrait.mirrored,
			},
		});

		window.removeEventListener("mouseup", this.windowMouseButtonUpHandler);
		this.dragPoint = null;

		let chatMessage = <HTMLElement>document.getElementById("chat-message");
		chatMessage.focus();
	}

	calculateFinalLocalPosition(ev: MouseEvent, insert: StageInsert): number {
		let x = ev.clientX || ev.pageX;

		const portrait = <Portrait>insert.portrait;

		const deltaX = x - Number(this.dragPoint?.dragStartX);

		let finalX = portrait.x + deltaX;

		// global positions of bottom corners
		const bottomLeft = new PIXI.Point(0, 0);
		const bottomRight = new PIXI.Point(this.theatre.stage.width - portrait.width, 0);

		// bottom corner positions relative to parent
		const localBottomLeftX = portrait.root.parent.toLocal(bottomLeft).x;
		const localBottomRightX = portrait.root.parent.toLocal(bottomRight).x;

		// don't overshoot to the left
		const minX = Math.max(localBottomLeftX, -portrait.width / 2);

		// don't overshoot to the right
		const maxX = Math.min(localBottomRightX, portrait.width / 2);

		finalX = finalX > maxX ? maxX : finalX;
		finalX = finalX < minX ? minX : finalX;

		return finalX;
	}
}

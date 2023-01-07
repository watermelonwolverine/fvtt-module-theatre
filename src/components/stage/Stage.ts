import TheatreSettings from "../../extensions/TheatreSettings";
import Theatre from "../../Theatre";
import { SceneEventTypes } from "../../types/SceneEventTypes";
import type TheatreActor from "../../types/TheatreActor.js";
import TheatreStyle from "../../types/TheatreStyle";
import KHelpers from "../../workers/KHelpers";
import Tools from "../../workers/Tools";
import type StageInsert from "./StageInsert.js";
//@ts-ignore
// import { gsap, ScrollToPlugin, TextPlugin } from "/scripts/greensock/esm/all.js";

export default class Stage {
	theatre: Theatre;

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

	get width() {
		return <number>this.theatreBar?.offsetWidth;
	}

	get height() {
		return <number>this.pixiApplication?.renderer.view.height;
	}

	constructor(theatre: Theatre) {
		this.actors = new Map();
		this.stageInserts = [];
		this.theatre = theatre;
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
			width: document.body.offsetWidth,
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
			case TheatreStyle.CLEARBOX: {
				(<HTMLCanvasElement>this.theatreDock).style.height = "100%";
				break;
			}
			case TheatreStyle.MANGABUBBLE: {
				throw "NotImplemented";
			}
			case TheatreStyle.TEXTBOX: {
				break;
			}
			default: {
				(<HTMLCanvasElement>this.theatreDock).style.height = "99.5vh";
				break;
			}
		}
	}

	removeInsertById(theatreId: string, remote?: boolean): boolean {
		const toRemoveInsert = this.getInsertBy((insert) => insert.imgId == theatreId && !insert.deleting);

		const textBoxFilter = (textBox: HTMLElement) =>
			textBox.getAttribute("imgId") == theatreId && !textBox.getAttribute("deleting");

		const toRemoveTextBox = <HTMLElement>this.getTextBoxes().find(textBoxFilter);

		if (!toRemoveInsert || !toRemoveTextBox) {
			return false; // no-op
		}

		toRemoveInsert.deleting = true;

		return this._removeInsert(toRemoveInsert, toRemoveTextBox, remote);
	}

	/**
	 * Remove Inserts given the insert dock + corresponding TextBox
	 *
	 * @params toRemoveInsert (Object) : An Object representing the insert to be removed.
	 * @params toRemoveTextBox (HTMLElement) : The textbox of the insert to be removed.
	 * @params remote (Boolean) : Boolean indicating if this is being invoked remotely, or locally.
	 *
	 * @return (Object) : An object containing the items that were removed {insert : (Object), textBox: (HTMLElement)}
	 *					 or null if there was nothing to remove.
	 *
	 */
	_removeInsert(toRemoveInsert: StageInsert, toRemoveTextBox: HTMLElement, remote?: boolean) {
		let isOwner = this.theatre.isActorOwner(<string>game.user?.id, toRemoveInsert.imgId);
		// permission check
		if (!remote && !isOwner) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return false;
		}

		if (toRemoveInsert.decayTOId) {
			window.clearTimeout(toRemoveInsert.decayTOId);
			toRemoveInsert.decayTOId = undefined;
		}

		// WMW: TODO: Disabled for now, not sure if ever worked as intented
		// Save configuration if this is not a remote operation, and we're the owners of this
		// insert
		// if (!remote && isOwner) {
		//     const actorId = Tools.toActorId(toRemoveInsert.imgId);
		//     const actor: Actor = game.actors.get(actorId);
		//     if (actor) {
		//         let skel = {};
		//         skel["flags.theatre.settings.emote"] = toRemoveInsert.emote;
		//         skel["flags.theatre.settings.textflyin"] = toRemoveInsert.textFlyin;
		//         skel["flags.theatre.settings.textstanding"] = toRemoveInsert.textStanding;
		//         skel["flags.theatre.settings.textfont"] = toRemoveInsert.textFont;
		//         skel["flags.theatre.settings.textsize"] = toRemoveInsert.textSize;
		//         skel["flags.theatre.settings.textcolor"] = toRemoveInsert.textColor;
		//         actor.update(skel).then((response) => {
		//         });
		//     }
		// }

		// animate and delayed removal
		//let isLeft = toRemoveInsert.getElementsByClassName("theatre-portrait-left").length > 0;
		let exitX = 0;
		if (toRemoveInsert.portrait) {
			if (toRemoveInsert.exitOrientation == "left") {
				exitX = <number>toRemoveInsert.dockContainer?.x - toRemoveInsert.portrait.width;
			} else {
				exitX = <number>toRemoveInsert.dockContainer?.x + toRemoveInsert.portrait.width;
			}
		}

		// Push to socket our event
		if (!remote)
			this.theatre.sceneEventProcessor.sendSceneEvent(SceneEventTypes.exitscene, {
				insertid: toRemoveInsert.imgId,
			});

		// unactivate from navbar
		const controls: HTMLCollection = <HTMLCollection>this.theatre.theatreControls?.theatreNavBar?.children || [];
		for (const navItem of controls) {
			if (navItem.getAttribute("imgId") == toRemoveInsert.imgId) {
				KHelpers.removeClass(<HTMLElement>navItem, "theatre-control-nav-bar-item-active");
				if (toRemoveInsert.imgId == this.theatre.speakingAs)
					KHelpers.removeClass(<HTMLElement>navItem, "theatre-control-nav-bar-item-speakingas");
			}
		}
		// clear chat cover + effects if active for this ID
		if (this.theatre.speakingAs == toRemoveInsert.imgId) {
			let cimg = this.theatre.getTheatreCoverPortrait();
			cimg.removeAttribute("src");
			cimg.style.opacity = "0";
			gsap.killTweensOf(toRemoveInsert.label);
			// clear typing
			for (let userId in this.theatre.usersTyping) {
				if (
					this.theatre.usersTyping.get(userId) &&
					this.theatre.usersTyping?.get(userId)?.theatreId == toRemoveInsert.imgId
				) {
					this.theatre.removeUserTyping(userId);
					this.theatre.usersTyping.delete(userId);
					break;
				}
			}
			// clear label
			// clear speakingAs
			this.theatre.speakingAs = null;
			this.theatre.emoteMenuRenderer.initialize();
		}
		// kill any animations of textBox
		for (let c of toRemoveTextBox.children) {
			for (let sc of c.children) gsap.killTweensOf(sc);
			gsap.killTweensOf(c);
		}
		gsap.killTweensOf(toRemoveTextBox);
		/*
        for (let c of toRemoveTextBox.children)
            c.parentNode.removeChild(c);
        */
		// fade away text box
		toRemoveTextBox.style.opacity = "0";

		const theatre = this.theatre;

		// animate away the dockContainer
		let tweenId = "containerSlide";
		let tween = TweenMax.to((<PIXI.Container>toRemoveInsert.dockContainer), 1, {
			//delay: 0.5,
			pixi: { x: exitX, alpha: 0 },
			ease: Power4.easeOut,
			onComplete: function (imgId, tweenId) {
				// decrement the rendering accumulator
				theatre._removeDockTween(imgId, this, tweenId);
				// remove our own reference from the dockContainer tweens
			},
			onCompleteParams: [toRemoveInsert.imgId, tweenId],
		});
		this.theatre._addDockTween(toRemoveInsert.imgId, tween, tweenId);

		window.setTimeout(() => {
			this.theatre._destroyPortraitDock(toRemoveInsert.imgId);
			this.theatre._removeTextBoxFromTheatreBar(toRemoveTextBox);

			if (this.theatre.reorderTOId) window.clearTimeout(this.theatre.reorderTOId);

			this.theatre.reorderTOId = window.setTimeout(() => {
				this.theatre.insertReorderer.reorderInserts();
				this.theatre.reorderTOId = null;
			}, 750);
		}, 1000);

		// return results of what was removed
		return true;
	}

	getInsertByName(name: string): StageInsert | undefined {
		return this.getInsertBy((dock) => dock.name == name);
	}

	getInsertById(theatreId: string): StageInsert | undefined {
		return this.getInsertBy((dock) => dock.imgId == theatreId);
	}

	getInsertBy(filter: (dock: StageInsert) => boolean): StageInsert | undefined {
		for (let idx = this.stageInserts.length - 1; idx >= 0; --idx) {
			const portraitDock = <StageInsert>this.stageInserts[idx];

			// WMW: I don't know why this is there, I just found it roughly like so..
			if (!this.stageInserts[idx]?.dockContainer) {
				this.stageInserts.splice(idx, 1);
				console.error(`Illegal Portrait Dock state for ${portraitDock.imgId}`);
				continue;
			}

			const itHit = filter(portraitDock);

			if (itHit) {
				return portraitDock;
			}
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
		if (!actor) return false;

		return this.actors.has(Tools.getTheatreId(actor));
	}

	handleWindowResize() {
		let dockWidth = <number>this.theatreDock?.offsetWidth;
		let dockHeight = <number>this.theatreDock?.offsetHeight;

		this.theatreDock?.setAttribute("width", String(dockWidth));
		this.theatreDock?.setAttribute("height", String(dockHeight));

		(<HTMLCanvasElement>this.pixiApplication?.renderer?.view).width = dockWidth;
		(<HTMLCanvasElement>this.pixiApplication?.renderer?.view).height = dockHeight;
		this.pixiApplication?.renderer.resize(dockWidth, dockHeight);

		this.maybeReapplyRelativePortraitSize();
		// TODO update size of portraits, now that they support relative heights
	}

	maybeReapplyRelativePortraitSize() {
		const imageSizeStr: string = TheatreSettings.getTheatreImageSize();
		if (!imageSizeStr.endsWith("%")) {
			return; // absolute values were set, so no dynamic resizing needed
		}
		this.updatePortraits();
	}

	updatePortraits() {
		for (const insert of this.stageInserts) {
			insert.portrait?.updateGeometry();
		}
		Theatre.instance._renderTheatre(performance.now());
	}

	getTextBoxes(): HTMLElement[] {
		let textBoxes = [];
		for (let container of <HTMLCollection>this.theatreBar?.children) {
			for (let textBox of container.children) {
				textBoxes.push(<HTMLElement>textBox);
			}
		}
		return textBoxes;
	}

	getTextBoxById(theatreId: string): HTMLElement | undefined {
		return this.getTextBoxes().find((e) => {
			return e.getAttribute("imgId") == theatreId;
		});
	}

	getTextBoxByName(name: string) {
		return this.getTextBoxes().find((e) => {
			return e.getAttribute("name") == name;
		});
	}
}

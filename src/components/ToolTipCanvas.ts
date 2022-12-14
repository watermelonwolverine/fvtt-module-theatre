import type Params from "src/types/Params";
import Theatre from "../Theatre";
import KHelpers from "../workers/KHelpers";
import Tools from "../workers/Tools";
import type Stage from "./stage/Stage";

export default class ToolTipCanvas {
	application: PIXI.Application;
	canvas: HTMLCanvasElement;
	holder: HTMLDivElement;
	stage: Stage;

	constructor(stage: Stage) {
		this.stage = stage;
	}

	/**
	 * Initialize the tooltip canvas which renders previews for the emote menu
	 *
	 * @return (HTMLElement) : The canvas HTMLElement of the PIXI canvas created, or
	 *						  null if unsuccessful.
	 */
	initTheatreToolTipCanvas(): void {
		this.application = new PIXI.Application({ width: 140, height: 140, transparent: true, antialias: true });
		this.canvas = this.application.view;

		if (!canvas) {
			console.log("FAILED TO INITILIZE TOOLTIP CANVAS!");
			return;
		}

		this.holder = document.createElement("div");
		this.holder.id = "theatre-tooltip";
		KHelpers.addClass(this.holder, "theatre-tooltip");
		KHelpers.addClass(this.holder, "app");
		this.holder.style.opacity = "0";

		this.holder.appendChild(this.canvas);

		this.application.ticker.autoStart = false;
		this.application.ticker.stop();
	}

	/**
	 * configure the theatre tool tip based on the provided
	 * insert, if none is provided, the do nothing
	 *
	 * @params theatreId (String) : The theatreId of the insert to display in
	 *							  the theatre tool tip.
	 * @params emote (String) : The emote of the theatreId to get for dispay
	 *						  in the theatre tool tip.
	 */
	configureTheatreToolTip(theatreId: string, emote: string) {
		if (!theatreId || theatreId == Theatre.NARRATOR) {
			return;
		}
		let actorId = theatreId.replace("theatre-", "");
		let params = <Params>Tools.getInsertParamsFromActorId(actorId);
		let resources = PIXI.Loader.shared.resources;

		if (!params) {
			console.log("ERROR actor no longer exists for %s", theatreId);
			return;
		}

		let resName = <string>(
			(emote && params.emotes[emote] && params.emotes[emote]?.insert ? params.emotes[emote]?.insert : params.src)
		);

		if (!resources[resName] || !resources[resName]?.texture) {
			console.log("ERROR could not load texture (for tooltip) %s", resName, resources);
			return;
		}

		const app = this.application;

		// clear canvas
		for (let idx = app.stage.children.length - 1; idx >= 0; --idx) {
			let child = <PIXI.DisplayObject>app.stage.children[idx];
			child.destroy();
		}

		let sprite = new PIXI.Sprite(resources[resName]?.texture);
		let portWidth = Number(resources[resName]?.texture.width);
		let portHeight = Number(resources[resName]?.texture.height);
		let maxSide = Math.max(portWidth, portHeight);
		let scaledWidth, scaledHeight, ratio;
		if (maxSide == portWidth) {
			// scale portWidth to 200px, assign height as a fraction
			scaledWidth = 140;
			scaledHeight = (portHeight * 140) / portWidth;
			ratio = scaledHeight / portHeight;
			app.stage.width = scaledWidth;
			app.stage.height = scaledHeight;

			app.stage.addChild(sprite);
			app.stage.scale.x = ratio * 2;
			app.stage.scale.y = ratio * 2;
			app.stage.y = 70 - (portHeight * ratio) / 2;
		} else {
			// scale portHeight to 200px, assign width as a fraction
			scaledHeight = 140;
			scaledWidth = (portWidth * 140) / portHeight;
			ratio = scaledWidth / portWidth;
			app.stage.width = scaledWidth;
			app.stage.height = scaledHeight;

			app.stage.addChild(sprite);
			app.stage.scale.x = ratio * 2;
			app.stage.scale.y = ratio * 2;
			app.stage.x = 70 - (portWidth * ratio * 2) / 2;
		}

		// adjust dockContainer + portraitContainer dimensions to fit the image
		//app.stage.y = portHeight*ratio/2;

		// set sprite initial coordinates + state
		sprite.x = 0;
		sprite.y = 0;

		//console.log("Tooltip Portrait loaded with w:%s h:%s scale:%s",portWidth,portHeight,ratio,sprite);

		// render and show the tooltip
		app.render();
		this.holder.style.opacity = "1";
	}

	/**
	 * Store mouse position for our tooltip which will roam
	 *
	 * @param ev (Event) : The Event that triggered the mouse move.
	 */
	handleEmoteMenuMouseMove(ev: MouseEvent) {
		this.holder.style.top = `${(ev.clientY || ev.pageY) - this.holder.offsetHeight - 20}px`;
		this.holder.style.left = `${Math.min(
			(ev.clientX || ev.pageX) - this.holder.offsetWidth / 2,
			Number(this.stage.theatreDock?.offsetWidth) - this.holder.offsetWidth
		)}px`;
	}
}

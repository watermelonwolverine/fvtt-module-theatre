import Theatre from "../Theatre";
import type EmotionDefinition from "../types/EmotionDefinition";
import KHelpers from "./KHelpers";
import Tools from "./Tools";

export default class NavItemMouseEventHandler {
	theatre: Theatre;

	constructor(theatre: Theatre) {
		this.theatre = theatre;
	}

	handleNavItemDragStart(ev: DragEvent) {
		ev.dataTransfer?.clearData("text/plain");
		ev.dataTransfer?.clearData("text/html");
		ev.dataTransfer?.clearData("text/uri-list");
		(<DataTransfer>ev.dataTransfer).dropEffect = "move";
		ev.dataTransfer?.setDragImage(<HTMLElement>ev.currentTarget, 16, 16);
		this.theatre.dragNavItem = ev.currentTarget;
	}

	handleNavItemDragEnd(ev: DragEvent) {
		ev.preventDefault();
		this.theatre.dragNavItem = null;
	}

	handleNavItemDragOver(ev: DragEvent) {
		ev.preventDefault();
		(<DataTransfer>ev.dataTransfer).dropEffect = "move";
	}

	handleNavItemDragDrop(ev: DragEvent) {
		ev.preventDefault();
		KHelpers.insertBefore(Theatre.instance.dragNavItem, <HTMLElement>ev.currentTarget);
	}

	/**
	 * Handle mouse up on navItems
	 *
	 * @param ev (Event) : The Event that triggered this handler
	 */
	handleNavItemMouseUp(ev: MouseEvent) {
		const currentTarget = <HTMLElement>ev.currentTarget;

		let theatreId = <string>currentTarget.getAttribute("imgId");
		let actorId = Tools.toActorId(theatreId);
		let params = Tools.getInsertParamsFromActorId(actorId);

		if (!params) {
			ui.notifications.error(`ERROR, actorId ${actorId}%s does not exist!`);
			// TODO SHOW ERROR MESSAGE
			console.error("ERROR, actorId %s does not exist!", actorId);
			// remove the nav Item
			currentTarget.parentNode?.removeChild(currentTarget);
			return;
		}

		switch (ev.button) {
			case 0:
				this.theatre.activateInsertById(theatreId, ev);
				break;
			case 2:
				let removed = this.theatre.stage.removeInsertById(theatreId);
				if (ev.ctrlKey) {
					// unstage the actor
					this.theatre._removeFromStage(theatreId);
					return;
				}
				if (!removed) {
					let src = params.src;
					let name = params.name;
					let optAlign = params.optalign;
					let emotions: EmotionDefinition;

					// determine if to launch with actor saves or default settings
					if (ev.altKey) emotions = this.theatre._getInitialEmotionSetFromInsertParams(params, true);
					else emotions = this.theatre._getInitialEmotionSetFromInsertParams(params);

					if (!ev.shiftKey) {
						if (game.user?.isGM) this.theatre.injectLeftPortrait(src, name, theatreId, optAlign, emotions);
						else this.theatre.injectRightPortrait(src, name, theatreId, optAlign, emotions);
					} else this.theatre.injectRightPortrait(src, name, theatreId, optAlign, emotions);
				}
				break;
		}
	}
}

import type Theatre from "../../Theatre";
import KHelpers from "../../workers/KHelpers";
import NavItemMouseEventHandler from "../../workers/NavItemMouseEventHandler";
import Tools from "../../workers/Tools";
import type Stage from "../stage/Stage";
import TheatreActor from "../../types/TheatreActor";

export default class NavBar {
	//given
	theatre: Theatre;
	stage: Stage;

	// workers
	navItemMouseEventHandler: NavItemMouseEventHandler;

	constructor(theatre: Theatre, stage: Stage) {
		this.theatre = theatre;
		this.stage = stage;

		this.navItemMouseEventHandler = new NavItemMouseEventHandler(this.theatre);
	}

	init() {}

	addToNavBar(actorData: Actor) {
		if (!actorData) {
			return;
		}

		// if already on stage, dont add it again
		// create nav-list-item
		// set picture as actor.data.img
		// set attribute "theatre-id" to "theatre" + _id
		// set attribute "insertImg" to object.data.flags.theatre.baseinsert or img if not specified
		// add click handler to push it into the theatre bar, if it already exists on the bar, remove it
		// from the bar
		// add click handler logic to remove it from the stage

		let theatreId = Tools.getTheatreId(actorData);
		let portrait = actorData.img ? actorData.img : "icons/mystery-man.png";
		let optAlign = "top";
		let name = actorData.name;

		if (!this.theatre.isActorOwner(<string>game.user?.id, theatreId)) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return;
		}
		//@ts-ignore
		const flags: TheatreFlags = actorData.flags.theatre;

		// Use defaults incase the essential flag attributes are missing
		if (flags) {
			if (flags.name && flags.name != "") name = flags.name;
			if (flags.baseinsert && flags.baseinsert != "") portrait = flags.baseinsert;
			if (flags.optalign && flags.optalign != "") optAlign = flags.optalign;
		}

		if (this.stage.actors.get(theatreId)) {
			ui.notifications.info(actorData.name + game.i18n.localize("Theatre.UI.Notification.AlreadyStaged"));
			return;
		}

		let navItem = document.createElement("img");
		KHelpers.addClass(navItem, "theatre-control-nav-bar-item");
		//navItem.setAttribute("draggable",false);
		navItem.setAttribute("imgId", theatreId);
		navItem.setAttribute("src", portrait);
		navItem.setAttribute("title", name + (name == actorData.name ? "" : ` (${actorData.name})`));
		navItem.setAttribute("name", name);
		navItem.setAttribute("optalign", optAlign);

		// if the theatreId is present, then set our navItem as active!
		if (this.stage.getInsertById(theatreId)) KHelpers.addClass(navItem, "theatre-control-nav-bar-item-active");

		navItem.addEventListener("mouseup", (ev) => this.navItemMouseEventHandler.handleNavItemMouseUp(ev));
		navItem.addEventListener("dragstart", (ev) => this.navItemMouseEventHandler.handleNavItemDragStart(ev));
		navItem.addEventListener("dragend", (ev) => this.navItemMouseEventHandler.handleNavItemDragEnd(ev));
		navItem.addEventListener("dragover", (ev) => this.navItemMouseEventHandler.handleNavItemDragOver(ev));
		navItem.addEventListener("drop", (ev) => this.navItemMouseEventHandler.handleNavItemDragDrop(ev));

		this.theatre.theatreControls.theatreNavBar?.appendChild(navItem);
		// stage event
		this.theatre.stageInsertById(theatreId);
		// Store reference
		this.stage.actors.set(theatreId, new TheatreActor(actorData, navItem));
	}
}

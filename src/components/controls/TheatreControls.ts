import NavBar from "./NavBar";
import type Stage from "../stage/Stage";
import TheatreSettings from "../../extensions/TheatreSettings";
import type Theatre from "../../Theatre";
import KHelpers from "../../workers/KHelpers";

export default class TheatreControls {
	// given
	theatre: Theatre;
	stage: Stage;

	// components
	navBar: NavBar;

	// after initialization
	root?: HTMLDivElement;
	theatreNavBar?: HTMLDivElement;
	theatreChatCover?: HTMLDivElement;
	theatreEmoteMenu?: HTMLDivElement;

	constructor(theatre: Theatre, stage: Stage) {
		this.theatre = theatre;
		this.stage = stage;

		this.navBar = new NavBar(theatre, stage);
	}

	initHtml() {
		const chatControls = <HTMLElement>document.getElementById("chat-controls");
		let controlButtons = <HTMLElement>chatControls.getElementsByClassName("control-buttons")[0];
		const chatMessage = <HTMLElement>document.getElementById("chat-message");

		this.root = document.createElement("div");
		this.theatreNavBar = document.createElement("div");
		this.theatreChatCover = document.createElement("div");

		if (!game.user?.isGM && TheatreSettings.get(TheatreSettings.GM_ONLY)) {
			this.root.style.display = "none";
		}

		let imgCover = document.createElement("img");
		let btnSuppress = document.createElement("div");
		let iconSuppress = document.createElement("div");
		let btnEmote = document.createElement("div");
		let iconEmote = document.createElement("div");
		//let btnCinema = document.createElement("div");
		//let iconCinema = document.createElement("div");
		let btnNarrator;
		let iconNarrator;

		let btnResync = document.createElement("a");
		let iconResync = document.createElement("i");
		let btnQuote = document.createElement("a");
		let iconQuote = document.createElement("i");
		let btnDelayEmote = document.createElement("a");
		let iconDelayEmote = document.createElement("i");

		KHelpers.addClass(this.root, "theatre-control-group");
		KHelpers.addClass(this.theatreNavBar, "theatre-control-nav-bar");
		KHelpers.addClass(this.theatreNavBar, "no-scrollbar");
		KHelpers.addClass(this.theatreChatCover, "theatre-control-chat-cover");
		KHelpers.addClass(btnSuppress, "theatre-control-btn");
		KHelpers.addClass(iconSuppress, "theatre-icon-suppress");
		KHelpers.addClass(btnEmote, "theatre-control-btn");
		KHelpers.addClass(iconEmote, "theatre-icon-emote");
		//KHelpers.addClass(btnCinema,"theatre-control-btn");
		//KHelpers.addClass(iconCinema,"theatre-icon-cinema");
		KHelpers.addClass(btnResync, "button");
		KHelpers.addClass(btnResync, "resync-theatre");
		KHelpers.addClass(iconResync, "fas");
		KHelpers.addClass(iconResync, "fa-sync");
		KHelpers.addClass(btnQuote, "button");
		KHelpers.addClass(iconQuote, "fas");
		KHelpers.addClass(iconQuote, "fa-quote-right");
		KHelpers.addClass(btnDelayEmote, "button");
		KHelpers.addClass(iconDelayEmote, "fas");
		KHelpers.addClass(iconDelayEmote, "fa-comment-alt");

		btnEmote.setAttribute("title", game.i18n.localize("Theatre.UI.Title.EmoteSelector"));
		btnSuppress.setAttribute("title", game.i18n.localize("Theatre.UI.Title.SuppressTheatre"));
		btnResync.setAttribute(
			"title",
			game.user?.isGM
				? game.i18n.localize("Theatre.UI.Title.ResyncGM")
				: game.i18n.localize("Theatre.UI.Title.ResyncPlayer")
		);
		btnQuote.setAttribute("title", game.i18n.localize("Theatre.UI.Title.QuoteToggle"));
		btnDelayEmote.setAttribute("title", game.i18n.localize("Theatre.UI.Title.DelayEmoteToggle"));

		//btnCinema.setAttribute("title",game.i18n.localize("Theatre.UI.Title.CinemaSelector"));
		btnEmote.addEventListener("click", (ev) => this.handleBtnEmoteClick(ev));
		btnSuppress.addEventListener("click", (ev) => this.handleBtnSuppressClick(ev));
		btnResync.addEventListener("click", (ev) => this.handleBtnResyncClick(ev));
		btnQuote.addEventListener("click", (ev) => this.handleBtnQuoteClick(ev));

		btnDelayEmote.addEventListener("click", this.handleBtnDelayEmoteClick);
		//btnCinema.addEventListener("click", this.handleBtnCinemaClick);
		this.theatreNavBar.addEventListener("wheel", (ev) => this.handleNavBarWheel(ev));

		btnEmote.appendChild(iconEmote);
		btnSuppress.appendChild(iconSuppress);
		btnResync.appendChild(iconResync);
		btnQuote.appendChild(iconQuote);
		btnDelayEmote.appendChild(iconDelayEmote);
		//btnCinema.appendChild(iconCinema);
		this.theatreChatCover.appendChild(imgCover);

		this.root.appendChild(this.theatreNavBar);

		if (game.user?.isGM) {
			btnNarrator = document.createElement("div");
			iconNarrator = document.createElement("div");
			KHelpers.addClass(btnNarrator, "theatre-control-btn");
			KHelpers.addClass(iconNarrator, "theatre-icon-narrator");
			btnNarrator.setAttribute("title", game.i18n.localize("Theatre.UI.Title.Narrator"));
			btnNarrator.appendChild(iconNarrator);
			btnNarrator.addEventListener("click", this.handleBtnNarratorClick);
			this.root.appendChild(btnNarrator);
		}

		this.root.appendChild(btnEmote);
		//this.theatreControls.appendChild(btnCinema);
		this.root.appendChild(btnSuppress);

		btnDelayEmote.style["margin"] = "0 4px";
		btnQuote.style["margin"] = "0 4px";
		btnResync.style["margin"] = "0 4px";

		if (game.user?.isGM || !TheatreSettings.get(TheatreSettings.GM_ONLY)) {
			if (controlButtons && controlButtons.children.length > 0) {
				controlButtons.style.setProperty("flex-basis", "100%");
				KHelpers.insertBefore(btnResync, <any>controlButtons.children[0]);
				KHelpers.insertBefore(btnQuote, btnResync);
				KHelpers.insertBefore(btnDelayEmote, btnQuote);
			} else {
				controlButtons = document.createElement("div");
				KHelpers.addClass(controlButtons, "control-buttons");
				controlButtons.style.setProperty("flex-basis", "100%");
				controlButtons.appendChild(btnDelayEmote);
				controlButtons.appendChild(btnQuote);
				controlButtons.appendChild(btnResync);
				chatControls.appendChild(controlButtons);
			}
		}

		KHelpers.insertBefore(this.root, chatControls);
		KHelpers.insertAfter(this.theatreChatCover, chatMessage);

		// bind listener to chat message
		chatMessage.addEventListener("keydown", (ev) => this.handleChatMessageKeyDown(ev));
		chatMessage.addEventListener("keyup", (ev) => this.handleChatMessageKeyUp(ev));
		chatMessage.addEventListener("focusout", (ev) => this.handleChatMessageFocusOut(ev));

		/*
		 * Emote Menu
		 */
		this.theatreEmoteMenu = document.createElement("div");
		KHelpers.addClass(this.theatreEmoteMenu, "theatre-emote-menu");
		KHelpers.addClass(this.theatreEmoteMenu, "app");
		KHelpers.insertBefore(this.theatreEmoteMenu, this.root);

		/**
		 * Tooltip
		 */
		this.theatreEmoteMenu.addEventListener("mousemove", (ev) =>
			this.theatre.toolTipCanvas.handleEmoteMenuMouseMove(ev)
		);
	}

	handleChatMessageFocusOut(ev: FocusEvent) {
		KHelpers.removeClass(<HTMLDivElement>this.theatreChatCover, "theatre-control-chat-cover-ooc");
	}

	handleChatMessageKeyUp(ev: KeyboardEvent) {
		if (
			!ev.repeat &&
			//&& this.theatre.speakingAs
			ev.key == "Control"
		)
			KHelpers.removeClass(<HTMLDivElement>this.theatreChatCover, "theatre-control-chat-cover-ooc");
	}

	handleChatMessageKeyDown(ev: KeyboardEvent) {
		const context = KeyboardManager.getKeyboardEventContext(ev, false);
		// @ts-ignore ts2445
		const actions = KeyboardManager._getMatchingActions(context);
		for (const action of actions) {
			if (!action.action.includes("theatre")) continue;
			action.onDown.call(context);
		}

		let now = Date.now();

		if (
			!ev.repeat &&
			//&& this.theatre.speakingAs
			ev.key == "Control"
		)
			KHelpers.addClass(<HTMLDivElement>this.theatreChatCover, "theatre-control-chat-cover-ooc");

		if (now - this.theatre.lastTyping < 3000) return;
		if (ev.key == "Enter" || ev.key == "Alt" || ev.key == "Shift" || ev.key == "Control") return;
		this.theatre.lastTyping = now;
		this.theatre.setUserTyping(<string>game.user?.id, this.theatre.speakingAs);
		this.theatre._sendTypingEvent();
	}

	/**
	 * NOTE: this has issues with multiple GMs since the narrator bar currently works as a
	 * "shim" in that it pretends to be a proper insert for text purposes only.
	 *
	 * If another GM activates another charater, it will minimize the bar for a GM that is trying
	 * to use the bar
	 *
	 */
	handleBtnNarratorClick(ev: MouseEvent) {
		const currentTarget = <HTMLElement>ev.currentTarget;

		if (KHelpers.hasClass(currentTarget, "theatre-control-nav-bar-item-speakingas")) {
			this.theatre.toggleNarratorBar(false, false);
		} else {
			this.theatre.toggleNarratorBar(true, false);
		}
	}

	handleBtnCinemaClick(ev: MouseEvent) {
		ui.notifications.info(game.i18n.localize("Theatre.NotYet"));

		// WMW TODO check
		/*
        if (KHelpers.hasClass(currentTarget,"theatre-control-small-btn-down")) {
            KHelpers.removeClass(currentTarget,"theatre-control-small-btn-down");
        } else {
            KHelpers.addClass(currentTarget,"theatre-control-small-btn-down");
            ui.notifications.info(game.i18n.localize("Theatre.NotYet"));
        }
        */
	}

	handleBtnDelayEmoteClick(ev: MouseEvent) {
		const currentTarget = <HTMLElement>ev.currentTarget;

		if (this.theatre.isDelayEmote) {
			if (KHelpers.hasClass(currentTarget, "theatre-control-small-btn-down"))
				KHelpers.removeClass(currentTarget, "theatre-control-small-btn-down");
			this.theatre.isDelayEmote = false;
		} else {
			if (!KHelpers.hasClass(currentTarget, "theatre-control-small-btn-down"))
				KHelpers.addClass(currentTarget, "theatre-control-small-btn-down");
			this.theatre.isDelayEmote = true;
		}

		let chatMessage = document.getElementById("chat-message");
		chatMessage?.focus();
	}

	handleBtnQuoteClick(ev: MouseEvent) {
		const currentTarget = <HTMLElement>ev.currentTarget;

		if (this.theatre.isQuoteAuto) {
			if (KHelpers.hasClass(currentTarget, "theatre-control-small-btn-down"))
				KHelpers.removeClass(currentTarget, "theatre-control-small-btn-down");
			this.theatre.isQuoteAuto = false;
		} else {
			if (!KHelpers.hasClass(currentTarget, "theatre-control-small-btn-down"))
				KHelpers.addClass(currentTarget, "theatre-control-small-btn-down");
			this.theatre.isQuoteAuto = true;
		}

		let chatMessage = document.getElementById("chat-message");
		chatMessage?.focus();
	}

	handleBtnResyncClick(ev: MouseEvent) {
		if (game.user?.isGM) {
			this.theatre._sendResyncRequest("players");
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.ResyncGM"));
		} else {
			this.theatre._sendResyncRequest("gm");
		}
	}

	handleBtnSuppressClick(ev: MouseEvent) {
		const currentTarget = <HTMLElement>ev.currentTarget;

		if (this.theatre.isSuppressed) {
			if (KHelpers.hasClass(currentTarget, "theatre-control-btn-down")) {
				KHelpers.removeClass(currentTarget, "theatre-control-btn-down");
			}
		} else {
			KHelpers.addClass(currentTarget, "theatre-control-btn-down");
		}
		this.theatre.updateSuppression(!this.theatre.isSuppressed);
	}

	handleBtnEmoteClick(ev: MouseEvent) {
		const currentTarget = <HTMLElement>ev.currentTarget;

		if (KHelpers.hasClass(currentTarget, "theatre-control-btn-down")) {
			(<HTMLDivElement>this.theatreEmoteMenu).style.display = "none";
			KHelpers.removeClass(currentTarget, "theatre-control-btn-down");
		} else {
			this.theatre.emoteMenuRenderer.initialize();
			(<HTMLDivElement>this.theatreEmoteMenu).style.display = "flex";
			KHelpers.addClass(currentTarget, "theatre-control-btn-down");
		}
	}

	handleNavBarWheel(ev: WheelEvent) {
		const currentTarget = <HTMLElement>ev.currentTarget;

		ev.preventDefault();
		let pos = ev.deltaY > 0;
		currentTarget.scrollLeft += pos ? 10 : -10;
	}
}

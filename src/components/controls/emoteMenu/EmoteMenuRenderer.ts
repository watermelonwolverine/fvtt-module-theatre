import ActorExtensions from "../../../extensions/ActorExtensions";
import TheatreSettings from "../../../extensions/TheatreSettings";
import type { EmoteDictionary } from "../../../resources/resources_types";
import Theatre from "../../../Theatre";
import TextFlyinAnimationsFactory, { TextFlyinAnimationDefinitions } from "../../../workers/flyin_animations_factory";
import KHelpers from "../../../workers/KHelpers";
import TextStandingAnimationsFactory, {
	TextStandingAnimationDefinitionDictionary,
} from "../../../workers/standing_animations_factory";
import Tools from "../../../workers/Tools";
import type StageInsert from "../../stage/StageInsert";
import type ToolTipCanvas from "../../ToolTipCanvas";
import EmoteMenuItemMouseEventHandler from "./EmoteMenuItemMouseEventHandler";
import TextFlyInMenuItemMouseEventHandler from "./TextFlyInMenuItemMouseEventHandler";
import TextStandingMenuItemMouseEventHandler from "./TextStandingMenuItemMouseEventHandler";

export default class EmoteMenuInitilializer {
	// given
	theatre: Theatre;
	toolTipCanvas: ToolTipCanvas;

	// workers
	textFlyinMenuMouseEventHandler: TextFlyInMenuItemMouseEventHandler;
	textStandingMenuMouseEventHandler: TextStandingMenuItemMouseEventHandler;
	emoteMenuItemMouseEventHandler: EmoteMenuItemMouseEventHandler;

	// data
	textStandingAnimationDefinitions: TextStandingAnimationDefinitionDictionary;
	textFlyinAnimationsDefinitions: TextFlyinAnimationDefinitions;

	constructor(theatre: Theatre, toolTipCanvas: ToolTipCanvas) {
		this.theatre = theatre;
		this.toolTipCanvas = toolTipCanvas;

		this.textStandingAnimationDefinitions = TextStandingAnimationsFactory.getDefinitions();
		this.textFlyinAnimationsDefinitions = TextFlyinAnimationsFactory.getDefinitions();

		this.textFlyinMenuMouseEventHandler = new TextFlyInMenuItemMouseEventHandler(theatre);
		this.textStandingMenuMouseEventHandler = new TextStandingMenuItemMouseEventHandler(
			theatre,
			this.textStandingAnimationDefinitions
		);
		this.emoteMenuItemMouseEventHandler = new EmoteMenuItemMouseEventHandler(theatre, toolTipCanvas);
	}

	initialize() {
		// each actor may have a different emote set
		// get actor emote set for currently speaking emote, else use the default set
		let actorId = <string>this.theatre.speakingAs ? Tools.toActorId(this.theatre.speakingAs) : null;

		let actor;
		if (actorId) {
			actor = <Actor>game.actors?.get(actorId);
		}

		const emotes = ActorExtensions.getEmotesForActor(<string>actorId);
		// TODO find available fonts
		let fonts: string[] = [];

		renderTemplate("modules/theatre/app/templates/emote_menu.html", {
			emotes,
			textFlyin: this.textFlyinAnimationsDefinitions,
			textStanding: this.textStandingAnimationDefinitions,
			fonts,
		}).then((template) => {
			this._add_listeners(template, emotes);
		});
	}

	_add_listeners(template: string, emotes: EmoteDictionary) {
		let insert = <StageInsert>this.theatre.stage.getInsertById(this.theatre.speakingAs);
		(<HTMLDivElement>this.theatre.theatreControls.theatreEmoteMenu).style.top = `${
			Number(this.theatre.theatreControls.root?.offsetTop) - 410
		}px`;
		(<HTMLDivElement>this.theatre.theatreControls.theatreEmoteMenu).innerHTML = template;

		this._initTextAttributeSelectors(insert);

		this._initTextFlyinColumn(insert);

		this._initTextStandingColumn(insert);

		this._initEmoteTable(insert, emotes);
	}
	_initTextAttributeSelectors(insert: StageInsert) {
		const colorSelect = <HTMLSelectElement>(
			this.theatre.theatreControls.theatreEmoteMenu?.getElementsByClassName("colorselect")[0]
		);
		const fontSelect = <HTMLSelectElement>(
			this.theatre.theatreControls.theatreEmoteMenu?.getElementsByClassName("fontselect")[0]
		);

		this.set_fontSelect_value(insert, fontSelect);

		// assign color from insert
		if (insert && insert.emotion.textColor) {
			colorSelect.value = insert.emotion.textColor;
		} else if (
			this.theatre.userEmotes.get(<string>game.user?.id) &&
			this.theatre.userEmotes.get(<string>game.user?.id)?.textColor
		) {
			colorSelect.value = <string>this.theatre.userEmotes.get(<string>game.user?.id)?.textColor;
			if (insert) {
				insert.emotion.textColor = colorSelect.value;
			}
		}
		// assgin font size
		this.configure_size_select(insert);

		fontSelect.addEventListener("change", (ev) => {
			this.theatre.setUserEmote(
				<string>game.user?.id,
				this.theatre.speakingAs,
				"textfont",
				(<HTMLSelectElement>(<HTMLElement>ev.currentTarget)).value
			);
			this.initialize();
		});

		colorSelect.addEventListener("change", (ev) => {
			this.theatre.setUserEmote(
				<string>game.user?.id,
				this.theatre.speakingAs,
				"textcolor",
				(<HTMLSelectElement>(<HTMLElement>ev.currentTarget)).value
			);
		});

		// Apply our language specific fonts to the template
		// OR apply the font specified by the insert
		let headers = <any>this.theatre.theatreControls.theatreEmoteMenu?.getElementsByTagName("h2");
		let textAnims = <any>this.theatre.theatreControls.theatreEmoteMenu?.getElementsByClassName("textanim");
		for (let e of headers) this.theatre.applyFontFamily(e, TheatreSettings.getTitleFont());
		for (let element of textAnims) {
			let font = fontSelect.value;
			this.theatre.applyFontFamily(<HTMLElement>element, font);
			(<HTMLElement>element).addEventListener("wheel", (ev) => this.wheelFunc2(ev));
		}
	}

	configure_size_select(insert: StageInsert) {
		let sizeSelect = <HTMLSelectElement>(
			this.theatre.theatreControls.theatreEmoteMenu?.getElementsByClassName("sizeselect")[0]
		);

		let sizeIcon = document.createElement("div");
		let sizeValue = 2;
		if (insert) {
			sizeValue = Number(insert.emotion.textSize);
		} else if (this.theatre.userEmotes.get(<string>game.user?.id)) {
			sizeValue = Number(this.theatre.userEmotes.get(<string>game.user?.id)?.textSize);
		}
		switch (sizeValue) {
			case 3: {
				KHelpers.addClass(sizeIcon, "theatre-icon-fontsize-large");
				break;
			}
			case 1: {
				KHelpers.addClass(sizeIcon, "theatre-icon-fontsize-small");
				break;
			}
			default: {
				KHelpers.addClass(sizeIcon, "theatre-icon-fontsize-medium");
				break;
			}
		}
		sizeSelect.appendChild(sizeIcon);

		sizeSelect.addEventListener("click", this.sizeSelectChanged);
	}

	wheelFunc2(wheelEvent: WheelEvent) {
		//console.log("wheel on text-anim",(<HTMLElement>ev.currentTarget).parentNode.scrollTop,ev.deltaY,ev.deltaMode);
		let pos = wheelEvent.deltaY > 0;
		(<HTMLElement>(<HTMLElement>wheelEvent.currentTarget).parentNode).scrollTop += pos ? 10 : -10;
		wheelEvent.preventDefault();
		wheelEvent.stopPropagation();
	}

	set_fontSelect_value(insert: StageInsert, fontSelect: HTMLSelectElement) {
		// assign font from insert
		if (insert && insert.emotion.textFont) {
			fontSelect.value = insert.emotion.textFont;
		} else if (
			this.theatre.userEmotes.get(<string>game.user?.id) &&
			this.theatre.userEmotes?.get(<string>game.user?.id)?.textFont
		) {
			fontSelect.value = <string>this.theatre.userEmotes.get(<string>game.user?.id)?.textFont;
			if (insert) {
				insert.emotion.textFont = fontSelect.value;
			}
		} else {
			fontSelect.value = this.theatre.textFont;
		}
	}

	sizeSelectChanged(ev: UIEvent) {
		let insert = this.theatre.stage.getInsertById(this.theatre.speakingAs);
		let icon = <HTMLElement>(<HTMLElement>ev.currentTarget).children[0];
		let value = 2;
		if (insert) {
			value = Number(insert.emotion.textSize);
		} else if (this.theatre.userEmotes.get(<string>game.user?.id)) {
			value = Number(this.theatre.userEmotes.get(<string>game.user?.id)?.textSize);
		}

		switch (value) {
			case 3: {
				KHelpers.removeClass(icon, "theatre-icon-fontsize-large");
				KHelpers.addClass(icon, "theatre-icon-fontsize-medium");
				value = 2;
				break;
			}
			case 1: {
				KHelpers.removeClass(icon, "theatre-icon-fontsize-small");
				KHelpers.addClass(icon, "theatre-icon-fontsize-large");
				value = 3;
				break;
			}
			default: {
				KHelpers.removeClass(icon, "theatre-icon-fontsize-medium");
				KHelpers.addClass(icon, "theatre-icon-fontsize-small");
				value = 1;
				break;
			}
		}
		this.theatre.setUserEmote(<string>game.user?.id, this.theatre.speakingAs, "textsize", value.toString());
	}

	wheelFunc(wheelEvent: WheelEvent) {
		//console.log("wheel on text-box",(<HTMLElement>ev.currentTarget).scrollTop,ev.deltaY,ev.deltaMode);
		let pos = wheelEvent.deltaY > 0;
		(<HTMLElement>wheelEvent.currentTarget).scrollTop += pos ? 10 : -10;
		wheelEvent.preventDefault();
		wheelEvent.stopPropagation();
	}

	_initTextFlyinColumn(insert: StageInsert) {
		const textflying_box = <HTMLElement>(
			this.theatre.theatreControls.theatreEmoteMenu?.getElementsByClassName("textflyin-box")[0]
		);
		const theatre_container_column = <HTMLElement>(
			textflying_box.getElementsByClassName("theatre-container-column")[0]
		);
		(<HTMLElement>theatre_container_column).addEventListener("wheel", (ev) => this.wheelFunc(ev));

		for (let child_ of theatre_container_column.children) {
			const child = <HTMLElement>child_;

			child.addEventListener("mouseover", (ev) => this.textFlyinMenuMouseEventHandler.handleMouseOver(ev));
			child.addEventListener("mouseout", (ev) => this.textFlyinMenuMouseEventHandler.handleMouseOut(ev, child));
			child.addEventListener("mouseup", (ev) => this.textFlyinMenuMouseEventHandler.handleMouseButtonUp(ev));

			// check if this child is our configured 'text style'
			let childTextMode = child.getAttribute("name");
			if (insert) {
				let insertTextMode = insert.emotion.textFlyin;
				if (insertTextMode && insertTextMode == childTextMode) {
					KHelpers.addClass(child, "textflyin-active");
					// scroll to
					//TweenMax.to(flyinBox,.4,{scrollTo:{y:child.offsetTop, offsetY:flyinBox.offsetHeight/2}})
					theatre_container_column.scrollTop =
						child.offsetTop - Math.max(theatre_container_column.offsetHeight / 2, 0);
				}
			} else if (this.theatre.speakingAs == Theatre.NARRATOR) {
				let insertTextMode = this.theatre.theatreNarrator.getAttribute("textflyin");
				if (insertTextMode && insertTextMode == childTextMode) {
					KHelpers.addClass(child, "textflyin-active");
					// scroll to
					//TweenMax.to(flyinBox,.4,{scrollTo:{y:child.offsetTop, offsetY:flyinBox.offsetHeight/2}})
					theatre_container_column.scrollTop =
						child.offsetTop - Math.max(theatre_container_column.offsetHeight / 2, 0);
				}
			} else if (
				!insert &&
				this.theatre.userEmotes.get(<string>game.user?.id) &&
				child.getAttribute("name") == this.theatre.userEmotes.get(<string>game.user?.id)?.textFlyin
			) {
				KHelpers.addClass(child, "textflyin-active");
				// scroll to
				//TweenMax.to(flyinBox,.4,{scrollTo:{y:child.offsetTop, offsetY:flyinBox.offsetHeight/2}})
				theatre_container_column.scrollTop =
					child.offsetTop - Math.max(theatre_container_column.offsetHeight / 2, 0);
			}
		}
	}

	_initTextStandingColumn(insert: StageInsert) {
		const textStanding_Box = <HTMLElement>(
			this.theatre.theatreControls.theatreEmoteMenu?.getElementsByClassName("textstanding-box")[0]
		);
		const standingBox = <HTMLElement>textStanding_Box.getElementsByClassName("theatre-container-column")[0];

		(<HTMLElement>standingBox).addEventListener("wheel", (ev) => this.wheelFunc(ev));

		for (let child_ of standingBox.children) {
			const child = <HTMLElement>child_;

			child.addEventListener("mouseover", (ev) => this.textStandingMenuMouseEventHandler.handleMouseOver(ev));
			child.addEventListener("mouseout", (ev) =>
				this.textStandingMenuMouseEventHandler.handleMouseOut(ev, child)
			);
			child.addEventListener("mouseup", (ev) => this.textStandingMenuMouseEventHandler.handleMouseUp(ev));

			let childTextMode = child.getAttribute("name");

			if (insert) {
				let insertTextMode = insert.emotion.textStanding;
				if (insertTextMode && insertTextMode == childTextMode) {
					KHelpers.addClass(child, "textstanding-active");
					//TweenMax.to(standingBox,.4,{scrollTo:{y:child.offsetTop, offsetY:standingBox.offsetHeight/2}})
					standingBox.scrollTop = child.offsetTop - Math.max(standingBox.offsetHeight / 2, 0);
				}
			} else if (this.theatre.speakingAs == Theatre.NARRATOR) {
				let insertTextMode = this.theatre.theatreNarrator.getAttribute("textstanding");
				if (insertTextMode && insertTextMode == childTextMode) {
					KHelpers.addClass(child, "textstanding-active");
					// scroll to
					//TweenMax.to(standingBox,.4,{scrollTo:{y:child.offsetTop, offsetY:standingBox.offsetHeight/2}})
					standingBox.scrollTop = child.offsetTop - Math.max(standingBox.offsetHeight / 2, 0);
				}
			} else if (
				this.theatre.userEmotes.get(<string>game.user?.id) &&
				child.getAttribute("name") == this.theatre.userEmotes.get(<string>game.user?.id)?.textStanding
			) {
				KHelpers.addClass(child, "textstanding-active");
				// scroll to
				//TweenMax.to(standingBox,.4,{scrollTo:{y:child.offsetTop, offsetY:standingBox.offsetHeight/2}})
				standingBox.scrollTop = child.offsetTop - Math.max(standingBox.offsetHeight / 2, 0);
			}
		}
	}

	_initEmoteTable(insert: StageInsert, emotes: EmoteDictionary) {
		// If speaking as theatre, minimize away the emote section
		const fontSelect = <HTMLSelectElement>(
			this.theatre.theatreControls.theatreEmoteMenu?.getElementsByClassName("fontselect")[0]
		);
		const emoteBox = <HTMLElement>(
			this.theatre.theatreControls.theatreEmoteMenu?.getElementsByClassName("emote-box")[0]
		);
		const emContainer = <HTMLElement>emoteBox.getElementsByClassName("theatre-container-tiles")[0];

		if (this.theatre.speakingAs == Theatre.NARRATOR) {
			emoteBox.style.cssText += "flex: 0 0 40px";
			let emLabel = <HTMLElement>emoteBox.getElementsByTagName("h2")[0];
			fontSelect.style.setProperty("max-width", "unset");
			emContainer.style.display = "none";
			emLabel.style.display = "none";
		} else {
			// configure handles to bind emote selection
			let emoteBtns = <HTMLCollectionOf<Element>>(
				this.theatre.theatreControls.theatreEmoteMenu?.getElementsByClassName("emote")
			);
			for (const child_ of emoteBtns) {
				const child = <HTMLElement>child_;
				child.addEventListener("mouseup", (ev) => this.emoteMenuItemMouseEventHandler.handleMouseUp(ev));
				child.addEventListener("mouseenter", (ev) => this.emoteMenuItemMouseEventHandler.handleMouseEnter(ev));

				// check if this child is our configured 'emote'
				let childEmote = <string>child.getAttribute("name");
				if (insert) {
					// if we have an insert we're speaking through, we should get that emote state instead
					// if the insert has no emote state, neither should we despite user settings
					let insertEmote = insert.emotion.emote;
					if (insertEmote && insertEmote == childEmote) {
						KHelpers.addClass(child, "emote-active");
						//emContainer.scrollTop = child.offsetTop-Math.max(emContainer.offsetHeight/2,0);
					}
					// we should 'highlight' emotes that at least have a base insert
					if (emotes[childEmote] && emotes[childEmote]?.insert) {
						KHelpers.addClass(child, "emote-imgavail");
					}
				}
				if (
					!insert &&
					this.theatre.userEmotes.get(<string>game.user?.id) &&
					childEmote == this.theatre.userEmotes.get(<string>game.user?.id)?.emote
				) {
					KHelpers.addClass(child, "emote-active");
					//emContainer.scrollTop = child.offsetTop-Math.max(emContainer.offsetHeight/2,0);
				}
			}
			// bind mouseleave Listener
			emoteBtns[0]?.parentNode?.addEventListener("mouseleave", (ev) => {
				this.toolTipCanvas.holder.style.opacity = "0";
			});
		}
	}
}

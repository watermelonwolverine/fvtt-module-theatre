import type Theatre from "../../../Theatre";
import TextFlyinAnimationsFactory from "../../../workers/flyin_animations_factory";
import KHelpers from "../../../workers/KHelpers";
import TextBoxToCharSplitter from "../../../workers/TextBoxToCharSplitter";

export default class TextFlyInMenuItemMouseEventHandler {
	theatre: Theatre;

	constructor(theatre: Theatre) {
		this.theatre = theatre;
	}

	handleMouseButtonUp(ev: MouseEvent) {
		if ((<MouseEvent>ev).button == 0) {
			if (KHelpers.hasClass(<HTMLElement>ev.currentTarget, "textflyin-active")) {
				KHelpers.removeClass(<HTMLElement>ev.currentTarget, "textflyin-active");
				this.theatre.setUserEmote(<string>game.user?.id, this.theatre.speakingAs, "textflyin", null);
			} else {
				let lastActives = <any>(
					this.theatre.theatreControls.theatreEmoteMenu?.getElementsByClassName("textflyin-active")
				);
				for (let lastActive of lastActives) {
					KHelpers.removeClass(<HTMLElement>lastActive, "textflyin-active");
				}
				//if (insert || this.context.speakingAs == Theatre.NARRATOR) {
				KHelpers.addClass(<HTMLElement>ev.currentTarget, "textflyin-active");
				this.theatre.setUserEmote(
					<string>game.user?.id,
					this.theatre.speakingAs,
					"textflyin",
					<string>(<HTMLElement>ev.currentTarget).getAttribute("name")
				);
				//}
			}
			// push focus to chat-message
			let chatMessage = document.getElementById("chat-message");
			chatMessage?.focus();
		}
	}

	handleMouseOut(ev: MouseEvent, sender: HTMLElement): void {
		const currentTarget = <HTMLElement>(<HTMLElement>ev.currentTarget);

		for (let child of currentTarget.children) {
			for (let sub_child of child.children) {
				gsap.killTweensOf(sub_child);
			}
			gsap.killTweensOf(child);
		}
		for (let child of currentTarget.children) {
			child.parentNode?.removeChild(child);
		}

		gsap.killTweensOf(sender);
		(<HTMLElement>sender).style.setProperty("overflow-y", "scroll");
		(<HTMLElement>sender).style.setProperty("overflow-x", "hidden");

		currentTarget.textContent = currentTarget.getAttribute("otext");
	}

	handleMouseOver(ev: MouseEvent): void {
		const text = <string>(<HTMLElement>(<HTMLElement>ev.currentTarget)).getAttribute("otext");
		const anim = <string>(<HTMLElement>(<HTMLElement>ev.currentTarget)).getAttribute("name");
		//console.log("child text: ",text,(<HTMLElement>ev.currentTarget));
		(<HTMLElement>(<HTMLElement>ev.currentTarget)).textContent = "";
		const charSpans = TextBoxToCharSplitter.splitTextBoxToChars(text, <HTMLElement>ev.currentTarget);
		TextFlyinAnimationsFactory.getForName(anim)(charSpans, 0.5, 0.05, null);
	}
}

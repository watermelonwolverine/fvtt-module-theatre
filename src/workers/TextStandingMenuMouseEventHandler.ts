import Theatre from "../Theatre";
import TextFlyinAnimationsFactory from "./flyin_animations_factory";
import KHelpers from "./KHelpers";
import { TextStandingAnimationDefinitionDictionary } from "./standing_animations_factory";
import TextBoxToCharSplitter from "./TextBoxToCharSplitter";

export default class TextStandingMenuMouseEventHandler {

    theatre: Theatre;
    animationDefinitions: TextStandingAnimationDefinitionDictionary;


    constructor(
        theatre: Theatre,
        animationDefinitions: TextStandingAnimationDefinitionDictionary) {

        this.theatre = theatre;
        this.animationDefinitions = animationDefinitions;
    }

    handleMouseOver(ev: MouseEvent): void {

        const currentTarget = <HTMLElement>ev.currentTarget;

        let text = currentTarget.getAttribute("otext");
        let anim = currentTarget.getAttribute("name");

        currentTarget.textContent = "";
        let charSpans = TextBoxToCharSplitter.splitTextBoxToChars(text, currentTarget);
        TextFlyinAnimationsFactory.do_typewriter(
            charSpans,
            0.5,
            0.05,
            (this.animationDefinitions[anim] ? this.animationDefinitions[anim].func : null));
    }

    handleMouseOut(
        ev: MouseEvent,
        sender: HTMLElement): void {

        const currentTarget = <HTMLElement>ev.currentTarget;

        for (let c of currentTarget.children) {
            for (let sc of c.children)
                gsap.killTweensOf(sc);
            gsap.killTweensOf(c);
        }
        for (let c of currentTarget.children)
            c.parentNode.removeChild(c);
        gsap.killTweensOf(sender);
        sender.style.setProperty("overflow-y", "scroll");
        sender.style.setProperty("overflow-x", "hidden");

        currentTarget.textContent = currentTarget.getAttribute("otext");
    }

    handleMouseUp(ev: MouseEvent): void {

        const currentTarget = <HTMLElement>ev.currentTarget;

        if (ev.button == 0) {
            if (KHelpers.hasClass(currentTarget, "textstanding-active")) {

                KHelpers.removeClass(
                    <HTMLElement>ev.currentTarget,
                    "textstanding-active");

                this.theatre.setUserEmote(
                    game.user.id,
                    this.theatre.speakingAs,
                    'textstanding',
                    null);

            } else {
                let lastActives = this.theatre.theatreEmoteMenu.getElementsByClassName("textstanding-active");

                for (const lastActive of lastActives) {
                    KHelpers.removeClass(
                        <HTMLElement>lastActive,
                        "textstanding-active");
                }

                KHelpers.addClass(
                    <HTMLElement>ev.currentTarget,
                    "textstanding-active");

                this.theatre.setUserEmote(
                    game.user.id,
                    this.theatre.speakingAs,
                    'textstanding',
                    currentTarget.getAttribute("name"));

            }

            let chatMessage = document.getElementById("chat-message");
            chatMessage.focus();
        }
    }
}
import Theatre from "../Theatre";
import ToolTipCanvas from "../types/ToolTipCanvas";
import KHelpers from "../workers/KHelpers";

export default class EmoteMenuItemMouseEventHandler {


    theatre: Theatre;
    toolTipCanvas: ToolTipCanvas;

    constructor(theatre: Theatre,
        toolTipCanvas: ToolTipCanvas) {
        this.theatre = theatre;
        this.toolTipCanvas = toolTipCanvas;
    }

    handleMouseUp(ev: MouseEvent) {

        const currentTarget = <HTMLElement>ev.currentTarget;

        if (ev.button == 0) {
            let emName = currentTarget.getAttribute("name");
            if (Theatre.DEBUG) console.log("em name: %s was clicked", emName);
            if (KHelpers.hasClass(currentTarget, "emote-active")) {
                KHelpers.removeClass(currentTarget, "emote-active");

                this.theatre.setUserEmote(
                    game.user.id,
                    this.theatre.speakingAs,
                    'emote',
                    null);

            } else {

                let lastActives = this.theatre.theatreEmoteMenu.getElementsByClassName("emote-active");

                for (let la of lastActives) {
                    KHelpers.removeClass(<HTMLElement>la, "emote-active");
                }

                KHelpers.addClass(currentTarget, "emote-active");

                this.theatre.setUserEmote(
                    game.user.id,
                    this.theatre.speakingAs,
                    'emote',
                    emName);
            }
            // push focus to chat-message
            let chatMessage = document.getElementById("chat-message");
            chatMessage.focus();
        }
    }

    handleMouseEnter(ev: MouseEvent): void {

        const currentTarget = <HTMLElement>ev.currentTarget;

        this.toolTipCanvas.configureTheatreToolTip(this.theatre.speakingAs, currentTarget.getAttribute("name"));
    }
}
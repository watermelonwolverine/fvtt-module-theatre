import ActorExtensions from "../extensions/ActorExtensions";
import TheatreSettings from "../extensions/settings";
import { EmoteDictionary } from "../resources/resources_types";
import Theatre from "../Theatre";
import StageInsert from "../types/StageInsert";
import ToolTipCanvas from "../types/ToolTipCanvas";
import TextFlyinAnimationsFactory from "./flyin_animations_factory";
import KHelpers from "./KHelpers";
import TextStandingAnimationsFactory, { TextStandingAnimationDefinitionDictionary } from "./standing_animations_factory";

export default class EmoteMenuRenderer {
    context: Theatre;
    toolTipCanvas: ToolTipCanvas;

    constructor(context: Theatre,
        toolTipCanvas: ToolTipCanvas) {
        this.context = context;
        this.toolTipCanvas = toolTipCanvas;
    }

    /**
 * Render the emote menu
 */
    render() {
        // each actor may have a different emote set
        // get actor emote set for currently speaking emote, else use the default set
        let actorId = this.context.speakingAs ? this.context.speakingAs.replace("theatre-", "") : null;

        let actor;
        if (actorId)
            actor = game.actors.get(actorId);

        const flyinAnimationsDefinitions = TextFlyinAnimationsFactory.getDefinitions();
        const emotes = ActorExtensions.getEmotes(actorId);
        // TODO find available fonts
        let fonts: string[] = [];
        const textStandingAnimationDefinitions = TextStandingAnimationsFactory.getDefinitions();

        renderTemplate("modules/theatre/app/templates/emote_menu.html", {
            emotes,
            textFlyin: flyinAnimationsDefinitions,
            textStanding: textStandingAnimationDefinitions,
            fonts
        }
        ).then(template => { this.add_listeners(template, emotes, textStandingAnimationDefinitions); });
    }

    add_listeners(template: string,
        emotes: EmoteDictionary,
        textStandingAnimationDefinitions: TextStandingAnimationDefinitionDictionary) {

        let insert = this.context.stage.getInsertById(this.context.speakingAs);

        if (Theatre.DEBUG) console.log("emote window template rendered");
        this.context.theatreEmoteMenu.style.top = `${this.context.theatreControls.offsetTop - 410}px`;
        this.context.theatreEmoteMenu.innerHTML = template;

        // bind handlers for the font/size/color selectors

        this.configure_selects(insert);

        // bind click listeners for the textanim elements to animate a preview
        // hover-off will reset the text content

        this.do_stuff(insert);

        this.do_stuff_2(insert,
            textStandingAnimationDefinitions);

        this.do_stuff_3(insert,
            emotes);
    }
    configure_selects(insert: StageInsert) {
        const colorSelect = <HTMLSelectElement>this.context.theatreEmoteMenu.getElementsByClassName('colorselect')[0];
        const fontSelect = <HTMLSelectElement>this.context.theatreEmoteMenu.getElementsByClassName('fontselect')[0];

        this.set_fontSelect_value(insert,
            fontSelect);
        // assign color from insert
        if (insert && insert.textColor) {
            colorSelect.value = insert.textColor;
        } else if (this.context.userEmotes.get(game.user.id) && this.context.userEmotes.get(game.user.id).textColor) {
            colorSelect.value = this.context.userEmotes.get(game.user.id).textColor;
            if (insert) insert.textColor = colorSelect.value;
        }
        // assgin font size
        this.configure_size_select(insert);

        fontSelect.addEventListener("change", ev => {
            this.context.setUserEmote(game.user.id, this.context.speakingAs, 'textfont', (<HTMLSelectElement>(<HTMLElement>ev.currentTarget)).value);
            this.render();
        });

        colorSelect.addEventListener("change", ev => {
            this.context.setUserEmote(game.user.id, this.context.speakingAs, 'textcolor', (<HTMLSelectElement>(<HTMLElement>ev.currentTarget)).value);
        });


        // Apply our language specific fonts to the template
        // OR apply the font specified by the insert
        let headers = this.context.theatreEmoteMenu.getElementsByTagName('h2');
        let textAnims = this.context.theatreEmoteMenu.getElementsByClassName('textanim');
        for (let e of headers)
            this.context.applyFontFamily(e, TheatreSettings.getTitleFont());
        for (let e of textAnims) {
            let font = fontSelect.value;
            this.context.applyFontFamily(e, font);
            (<HTMLElement>e).addEventListener("wheel", ev => this.wheelFunc2(ev));
        }
    }
    configure_size_select(insert: StageInsert) {

        let sizeSelect = <HTMLSelectElement>this.context.theatreEmoteMenu.getElementsByClassName('sizeselect')[0];

        let sizeIcon = document.createElement("div");
        let sizeValue = 2;
        if (insert)
            sizeValue = insert.textSize;
        else if (this.context.userEmotes.get(game.user.id))
            sizeValue = this.context.userEmotes.get(game.user.id).textSize;

        switch (sizeValue) {
            case 3:
                KHelpers.addClass(sizeIcon, "theatre-icon-fontsize-large");
                break;
            case 1:
                KHelpers.addClass(sizeIcon, "theatre-icon-fontsize-small");
                break;
            default:
                KHelpers.addClass(sizeIcon, "theatre-icon-fontsize-medium");
                break;
        }
        sizeSelect.appendChild(sizeIcon);

        sizeSelect.addEventListener("click", this.sizeSelectChanged);
    }

    wheelFunc2(wheelEvent: WheelEvent) {
        //console.log("wheel on text-anim",(<HTMLElement>ev.currentTarget).parentNode.scrollTop,ev.deltaY,ev.deltaMode); 
        let pos = wheelEvent.deltaY > 0;
        (<HTMLElement>(<HTMLElement>wheelEvent.currentTarget).parentNode).scrollTop += (pos ? 10 : -10);
        wheelEvent.preventDefault();
        wheelEvent.stopPropagation();
    }

    set_fontSelect_value(insert: StageInsert,
        fontSelect: HTMLSelectElement) {
        // assign font from insert
        if (insert && insert.textFont) {
            fontSelect.value = insert.textFont;
        } else if (this.context.userEmotes.get(game.user.id) && this.context.userEmotes.get(game.user.id).textFont) {

            fontSelect.value = this.context.userEmotes.get(game.user.id).textFont;
            if (insert) insert.textFont = fontSelect.value;
        } else {
            fontSelect.value = this.context.textFont;
        }
    }


    sizeSelectChanged(ev: UIEvent) {
        let insert = this.context.stage.getInsertById(this.context.speakingAs);
        let icon = <HTMLElement>(<HTMLElement>ev.currentTarget).children[0];
        let value = 2;
        if (insert)
            value = insert.textSize;
        else if (this.context.userEmotes.get(game.user.id))
            value = this.context.userEmotes.get(game.user.id).textSize;


        switch (value) {
            case 3:
                KHelpers.removeClass(icon, "theatre-icon-fontsize-large");
                KHelpers.addClass(icon, "theatre-icon-fontsize-medium");
                value = 2;
                break;
            case 1:
                KHelpers.removeClass(icon, "theatre-icon-fontsize-small");
                KHelpers.addClass(icon, "theatre-icon-fontsize-large");
                value = 3;
                break;
            default:
                KHelpers.removeClass(icon, "theatre-icon-fontsize-medium");
                KHelpers.addClass(icon, "theatre-icon-fontsize-small");
                value = 1;
                break;
        }
        this.context.setUserEmote(game.user.id, this.context.speakingAs, 'textsize', value);
    }

    wheelFunc(wheelEvent: WheelEvent) {
        //console.log("wheel on text-box",(<HTMLElement>ev.currentTarget).scrollTop,ev.deltaY,ev.deltaMode); 
        let pos = wheelEvent.deltaY > 0;
        (<HTMLElement>wheelEvent.currentTarget).scrollTop += (pos ? 10 : -10);
        wheelEvent.preventDefault();
        wheelEvent.stopPropagation();
    }

    do_stuff(insert: StageInsert) {

        const textflying_box = <HTMLElement>this.context.theatreEmoteMenu.getElementsByClassName("textflyin-box")[0];
        const theatre_container_column = <HTMLElement>textflying_box.getElementsByClassName("theatre-container-column")[0];
        (<HTMLElement>theatre_container_column).addEventListener("wheel", ev => this.wheelFunc(ev));

        for (let child_ of theatre_container_column.children) {

            const child = <HTMLElement>child_;
            // get animation function
            // bind annonomous click listener
            child.addEventListener("mouseover", (ev) => {
                const text = (<HTMLElement>(<HTMLElement>ev.currentTarget)).getAttribute("otext");
                const anim = (<HTMLElement>(<HTMLElement>ev.currentTarget)).getAttribute("name");
                //console.log("child text: ",text,(<HTMLElement>ev.currentTarget)); 
                (<HTMLElement>(<HTMLElement>ev.currentTarget)).textContent = "";
                const charSpans = Theatre.splitTextBoxToChars(text, (<HTMLElement>ev.currentTarget));
                TextFlyinAnimationsFactory.getForName(anim)(
                    charSpans,
                    0.5,
                    0.05,
                    null);
            });
            child.addEventListener("mouseout", (ev) => {
                for (let child of (<HTMLElement>(<HTMLElement>ev.currentTarget)).children) {
                    for (let sub_child of child.children)
                        gsap.killTweensOf(sub_child);
                    gsap.killTweensOf(child);
                }
                for (let child of (<HTMLElement>(<HTMLElement>ev.currentTarget)).children)
                    child.parentNode.removeChild(child);
                gsap.killTweensOf(child);
                (<HTMLElement>child).style.setProperty("overflow-y", "scroll");
                (<HTMLElement>child).style.setProperty("overflow-x", "hidden");
                //console.log("all tweens",TweenMax.getAllTweens()); 
                (<HTMLElement>(<HTMLElement>ev.currentTarget)).textContent = (<HTMLElement>(<HTMLElement>ev.currentTarget)).getAttribute("otext");
            });

            // bind text anim type
            child.addEventListener("mouseup", (ev) => {

                if ((<MouseEvent>ev).button == 0) {
                    if (KHelpers.hasClass((<HTMLElement>ev.currentTarget), "textflyin-active")) {
                        KHelpers.removeClass((<HTMLElement>ev.currentTarget), "textflyin-active");
                        this.context.setUserEmote(game.user.id, this.context.speakingAs, 'textflyin', null);
                    } else {
                        let lastActives = this.context.theatreEmoteMenu.getElementsByClassName("textflyin-active");
                        for (let lastActive of lastActives)
                            KHelpers.removeClass(<HTMLElement>lastActive, "textflyin-active");
                        //if (insert || this.context.speakingAs == Theatre.NARRATOR) {
                        KHelpers.addClass((<HTMLElement>ev.currentTarget), "textflyin-active");
                        this.context.setUserEmote(game.user.id, this.context.speakingAs, 'textflyin', (<HTMLElement>ev.currentTarget).getAttribute("name"));
                        //}
                    }
                    // push focus to chat-message
                    let chatMessage = document.getElementById("chat-message");
                    chatMessage.focus();
                }
            });
            // check if this child is our configured 'text style' 
            let childTextMode = child.getAttribute("name");
            if (insert) {
                let insertTextMode = insert.textFlyin;
                if (insertTextMode && insertTextMode == childTextMode) {
                    KHelpers.addClass(child, "textflyin-active");
                    // scroll to
                    //TweenMax.to(flyinBox,.4,{scrollTo:{y:child.offsetTop, offsetY:flyinBox.offsetHeight/2}})
                    theatre_container_column.scrollTop = child.offsetTop - Math.max(theatre_container_column.offsetHeight / 2, 0);
                }
            } else if (this.context.speakingAs == Theatre.NARRATOR) {
                let insertTextMode = this.context.theatreNarrator.getAttribute("textflyin");
                if (insertTextMode && insertTextMode == childTextMode) {
                    KHelpers.addClass(child, "textflyin-active");
                    // scroll to
                    //TweenMax.to(flyinBox,.4,{scrollTo:{y:child.offsetTop, offsetY:flyinBox.offsetHeight/2}})
                    theatre_container_column.scrollTop = child.offsetTop - Math.max(theatre_container_column.offsetHeight / 2, 0);
                }
            } else if (!insert && this.context.userEmotes.get(game.user.id) && (child.getAttribute("name") == this.context.userEmotes.get(game.user.id).textFlyin)) {
                KHelpers.addClass(child, "textflyin-active");
                // scroll to
                //TweenMax.to(flyinBox,.4,{scrollTo:{y:child.offsetTop, offsetY:flyinBox.offsetHeight/2}})
                theatre_container_column.scrollTop = child.offsetTop - Math.max(theatre_container_column.offsetHeight / 2, 0);
            }
        }
    }

    do_stuff_2(insert: StageInsert,
        textStandingAnimationDefinitions: TextStandingAnimationDefinitionDictionary) {

        const textStanding_Box = <HTMLElement>this.context.theatreEmoteMenu.getElementsByClassName("textstanding-box")[0];
        const standingBox = <HTMLElement>textStanding_Box.getElementsByClassName("theatre-container-column")[0];

        (<HTMLElement>standingBox).addEventListener("wheel", ev => this.wheelFunc(ev))

        for (let child_ of standingBox.children) {

            const child = <HTMLElement>child_;

            // get animation function
            // bind annonomous click listener
            child.addEventListener("mouseover", (ev) => {
                let text = (<HTMLElement>ev.currentTarget).getAttribute("otext");
                let anim = (<HTMLElement>ev.currentTarget).getAttribute("name");
                //console.log("child text: ",text,(<HTMLElement>ev.currentTarget)); 
                (<HTMLElement>ev.currentTarget).textContent = "";
                let charSpans = Theatre.splitTextBoxToChars(text, (<HTMLElement>ev.currentTarget));
                TextFlyinAnimationsFactory.do_typewriter(
                    charSpans,
                    0.5,
                    0.05,
                    (textStandingAnimationDefinitions[anim] ? textStandingAnimationDefinitions[anim].func : null));
            });
            child.addEventListener("mouseout", (ev) => {
                for (let c of (<HTMLElement>ev.currentTarget).children) {
                    for (let sc of c.children)
                        gsap.killTweensOf(sc);
                    gsap.killTweensOf(c);
                }
                for (let c of (<HTMLElement>ev.currentTarget).children)
                    c.parentNode.removeChild(c);
                gsap.killTweensOf(child);
                child.style.setProperty("overflow-y", "scroll");
                child.style.setProperty("overflow-x", "hidden");
                //console.log("all tweens",TweenMax.getAllTweens()); 
                (<HTMLElement>ev.currentTarget).textContent = (<HTMLElement>ev.currentTarget).getAttribute("otext");
            });
            // bind text anim type
            child.addEventListener("mouseup", (ev) => {
                if (ev.button == 0) {
                    if (KHelpers.hasClass((<HTMLElement>ev.currentTarget), "textstanding-active")) {
                        KHelpers.removeClass((<HTMLElement>ev.currentTarget), "textstanding-active");
                        this.context.setUserEmote(game.user.id, this.context.speakingAs, 'textstanding', null);
                    } else {
                        let lastActives = this.context.theatreEmoteMenu.getElementsByClassName("textstanding-active");
                        for (const lastActive of lastActives)
                            KHelpers.removeClass(<HTMLElement>lastActive, "textstanding-active");
                        //if (insert || this.context.speakingAs == Theatre.NARRATOR) {
                        KHelpers.addClass((<HTMLElement>ev.currentTarget), "textstanding-active");
                        this.context.setUserEmote(game.user.id, this.context.speakingAs, 'textstanding', (<HTMLElement>ev.currentTarget).getAttribute("name"));
                        //}
                    }
                    // push focus to chat-message
                    let chatMessage = document.getElementById("chat-message");
                    chatMessage.focus();
                }
            });
            // check if this child is our configured 'text style' 
            let childTextMode = child.getAttribute("name");
            if (insert) {
                let insertTextMode = insert.textStanding;
                if (insertTextMode && insertTextMode == childTextMode) {
                    KHelpers.addClass(child, "textstanding-active");
                    //TweenMax.to(standingBox,.4,{scrollTo:{y:child.offsetTop, offsetY:standingBox.offsetHeight/2}})
                    standingBox.scrollTop = child.offsetTop - Math.max(standingBox.offsetHeight / 2, 0);
                }
            } else if (this.context.speakingAs == Theatre.NARRATOR) {
                let insertTextMode = this.context.theatreNarrator.getAttribute("textstanding");
                if (insertTextMode && insertTextMode == childTextMode) {
                    KHelpers.addClass(child, "textstanding-active");
                    // scroll to
                    //TweenMax.to(standingBox,.4,{scrollTo:{y:child.offsetTop, offsetY:standingBox.offsetHeight/2}})
                    standingBox.scrollTop = child.offsetTop - Math.max(standingBox.offsetHeight / 2, 0);
                }
            } else if (this.context.userEmotes.get(game.user.id) && (child.getAttribute("name") == this.context.userEmotes.get(game.user.id).textStanding)) {
                KHelpers.addClass(child, "textstanding-active");
                // scroll to
                //TweenMax.to(standingBox,.4,{scrollTo:{y:child.offsetTop, offsetY:standingBox.offsetHeight/2}})
                standingBox.scrollTop = child.offsetTop - Math.max(standingBox.offsetHeight / 2, 0);
            }
        }

    }

    do_stuff_3(insert: StageInsert,
        emotes: EmoteDictionary) {

        // If speaking as theatre, minimize away the emote section
        const fontSelect = <HTMLSelectElement>this.context.theatreEmoteMenu.getElementsByClassName('fontselect')[0];
        const emoteBox = <HTMLElement>this.context.theatreEmoteMenu.getElementsByClassName("emote-box")[0];
        const emContainer = <HTMLElement>emoteBox.getElementsByClassName("theatre-container-tiles")[0];

        if (this.context.speakingAs == Theatre.NARRATOR) {
            emoteBox.style.cssText += "flex: 0 0 40px";
            let emLabel = emoteBox.getElementsByTagName("h2")[0];
            fontSelect.style.setProperty("max-width", "unset");
            emContainer.style.display = "none";
            emLabel.style.display = "none";
        } else {
            // configure handles to bind emote selection
            let emoteBtns = this.context.theatreEmoteMenu.getElementsByClassName("emote");
            for (const child_ of emoteBtns) {

                const child = <HTMLElement>child_;
                //bind annomous click listener
                child.addEventListener("mouseup", (ev) => {
                    if (ev.button == 0) {
                        let emName = (<HTMLElement>ev.currentTarget).getAttribute("name");
                        if (Theatre.DEBUG) console.log("em name: %s was clicked", emName);
                        if (KHelpers.hasClass((<HTMLElement>ev.currentTarget), "emote-active")) {
                            KHelpers.removeClass((<HTMLElement>ev.currentTarget), "emote-active");
                            // if speaking set to base
                            this.context.setUserEmote(game.user.id, this.context.speakingAs, 'emote', null);
                        } else {
                            let lastActives = this.context.theatreEmoteMenu.getElementsByClassName("emote-active");
                            for (let la of lastActives)
                                KHelpers.removeClass(<HTMLElement>la, "emote-active");
                            KHelpers.addClass((<HTMLElement>ev.currentTarget), "emote-active");
                            // if speaking, then set our emote!
                            this.context.setUserEmote(game.user.id, this.context.speakingAs, 'emote', emName);
                        }
                        // push focus to chat-message
                        let chatMessage = document.getElementById("chat-message");
                        chatMessage.focus();
                    }
                });
                // bind mouseenter Listener
                child.addEventListener("mouseenter", (ev) => {
                    this.toolTipCanvas.configureTheatreToolTip(this.context.speakingAs, (<HTMLElement>ev.currentTarget).getAttribute("name"));
                });
                // check if this child is our configured 'emote'
                let childEmote = child.getAttribute("name");
                if (insert) {
                    // if we have an insert we're speaking through, we should get that emote state instead
                    // if the insert has no emote state, neither should we despite user settings
                    let insertEmote = insert.emote;
                    if (insertEmote && insertEmote == childEmote) {
                        KHelpers.addClass(child, "emote-active");
                        //emContainer.scrollTop = child.offsetTop-Math.max(emContainer.offsetHeight/2,0); 
                    }
                    // we should 'highlight' emotes that at least have a base insert
                    if (emotes[childEmote] && emotes[childEmote].insert)
                        KHelpers.addClass(child, "emote-imgavail");

                }
                if (!insert && this.context.userEmotes.get(game.user.id) && (childEmote == this.context.userEmotes.get(game.user.id).emote)) {
                    KHelpers.addClass(child, "emote-active");
                    //emContainer.scrollTop = child.offsetTop-Math.max(emContainer.offsetHeight/2,0); 
                }
            }
            // bind mouseleave Listener
            emoteBtns[0].parentNode.addEventListener("mouseleave", (ev) => {
                this.toolTipCanvas.holder.style.opacity = "0";
            });
        }
    }
}
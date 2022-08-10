import Theatre from "../Theatre.js";
import KHelpers from "./KHelpers.js";
import { TextStandingAnimationFunction } from "./standing_animations_factory.js";

export type Context = any;

export type TextFlyinAnimationFunction = (
    target: HTMLElement,
    charSpans: any,
    animTime: number,
    speed: number,
    standingAnim: TextStandingAnimationFunction) => void

export type TextFlyinAnimationDefinition = {
    func: TextFlyinAnimationFunction;
    label: string;
}

export default class TextFlyinAnimationsFactory {

    static TYPEWRITER: "typewriter";
    static FADEIN: "fadein";
    static SLIDE_IN: "slidein";
    static SCALE_IN: "scalein";
    static FALL_IN: "fallin";
    static SPIN: "spin";
    static SPIN_SCALE: "spinscale";
    static OUTLAW: "outlaw";
    static VORTEX: "vortex";
    static ASSEMBLE: "assemble";

    static ALL_ANIMATIONS: string[] = [
        TextFlyinAnimationsFactory.TYPEWRITER,
        TextFlyinAnimationsFactory.FADEIN,
        TextFlyinAnimationsFactory.SLIDE_IN,
        TextFlyinAnimationsFactory.SCALE_IN,
        TextFlyinAnimationsFactory.FALL_IN,
        TextFlyinAnimationsFactory.SPIN,
        TextFlyinAnimationsFactory.SPIN_SCALE,
        TextFlyinAnimationsFactory.OUTLAW,
        TextFlyinAnimationsFactory.VORTEX,
        TextFlyinAnimationsFactory.ASSEMBLE
    ]

    static getDefinitions(): { [key: string]: TextFlyinAnimationDefinition } {

        const result: { [key: string]: TextFlyinAnimationDefinition } = {};

        for (const name in this.ALL_ANIMATIONS) {
            result[name] = {
                func: this.getForName(name),
                label: game.i18n.localize("Theatre.Flyin" + name)
            }
        }

        return result;
    }

    static getForName(name: string): TextFlyinAnimationFunction {
        switch (name) {
            case this.TYPEWRITER:
                return this.do_typewriter;

            case this.FADEIN:
                return this.do_fade_in;

            case this.SLIDE_IN:
                return this.do_slide_in;

            case this.SCALE_IN:
                return this.do_scale_in;

            case this.FALL_IN:
                return this.do_fall_in;

            case this.SPIN:
                return this.do_spin;

            case this.SPIN_SCALE:
                return this.do_spin_scale;

            case this.OUTLAW:
                return this.do_outlaw;

            case this.VORTEX:
                return this.do_vortex;

            case this.ASSEMBLE:
                return this.do_assemble;

            default:
                throw "NotImplemented";
        }


    }

    static do_typewriter(
        target: HTMLElement,
        charSpans: any,
        animTime: number,
        speed: number,
        standingAnim: TextStandingAnimationFunction): void {


        gsap.from(charSpans, {
            duration: 0.05,
            stagger: {
                each: 0.05,
                onComplete: function () {
                    if (standingAnim)
                        standingAnim(target);
                }
            },
            opacity: 0,
            scale: 1.5
        });

    }

    static do_fade_in(
        target: HTMLElement,
        charSpans: any,
        animTime: number,
        speed: number,
        standingAnim: TextStandingAnimationFunction) {
        gsap.from(charSpans, {
            duration: animTime,
            stagger: {
                each: speed,
                onComplete: function () {
                    if (standingAnim)
                        standingAnim(target);
                }
            },
            opacity: 0,
        });
    }

    static do_slide_in(
        target: HTMLElement,
        charSpans: any,
        animTime: number,
        speed: number,
        standingAnim: TextStandingAnimationFunction) {

        gsap.from(charSpans,
            {
                duration: animTime,
                stagger: {
                    each: speed,
                    onComplete: function () {
                        if (standingAnim)
                            standingAnim(target);
                    }
                },
                opacity: 0,
                left: 200
            }
        );
    }

    static do_scale_in(
        target: HTMLElement,
        charSpans: any,
        animTime: number,
        speed: number,
        standingAnim: TextStandingAnimationFunction) {
        gsap.from(charSpans,
            {
                duration: animTime,
                stagger: {
                    each: speed,
                    onComplete: function () {
                        if (standingAnim)
                            standingAnim(target);
                    }
                },
                opacity: 0,
                scale: 5,

                ease: Power4.easeOut
            }
        );
    }

    static do_fall_in(
        target: HTMLElement,
        charSpans: any,
        animTime: number,
        speed: number,
        standingAnim: TextStandingAnimationFunction) {

        let textBox: HTMLElement = null;

        if (charSpans[0]) {
            switch (Theatre.instance.settings.theatreStyle) {
                case "lightbox":
                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
                    if (!textBox)
                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                    break;
                case "clearbox":
                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
                    if (!textBox)
                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                    break;
                case "mangabubble":
                    break;
                case "textbox":
                default:
                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                    break;
            }
            if (textBox) {
                textBox.style.setProperty("overflow-y", "visible");
                textBox.style.setProperty("overflow-x", "visible");
            }
        }
        gsap.from(charSpans,
            {
                duration: animTime,
                stagger: {
                    each: speed,
                    onComplete: function () {
                        if (standingAnim)
                            standingAnim(target);
                    }
                },
                opacity: 0,
                top: -100,
                ease: Power4.easeOut,
                onComplete: () => {
                    if (Theatre.DEBUG) console.log("completeAll");
                    if (textBox) {
                        textBox.style.setProperty("overflow-y", "scroll");
                        textBox.style.setProperty("overflow-x", "hidden");
                    }
                }
            }
        );
    }

    static do_spin(
        target: HTMLElement,
        charSpans: any,
        animTime: number,
        speed: number,
        standingAnim: TextStandingAnimationFunction) {

        gsap.from(charSpans,
            {
                duration: animTime,
                stagger: {
                    each: speed,
                    onComplete: function () {
                        if (standingAnim)
                            standingAnim(target);
                    }
                },
                opacity: 0,
                rotation: -360,
                left: 100,
                ease: Power4.easeOut
            }
        );
    }

    static do_spin_scale(
        target: HTMLElement,
        charSpans: any,
        animTime: number,
        speed: number,
        standingAnim: TextStandingAnimationFunction) {

        let textBox: HTMLElement = null;
        if (charSpans[0]) {
            switch (Theatre.instance.settings.theatreStyle) {
                case "lightbox":
                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
                    if (!textBox)
                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                    break;
                case "clearbox":
                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
                    if (!textBox)
                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                    break;
                case "mangabubble":
                    break;
                case "textbox":
                default:
                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                    break;
            }
            if (textBox) {
                textBox.style.setProperty("overflow-y", "visible");
                textBox.style.setProperty("overflow-x", "visible");
            }
        }
        gsap.from(charSpans, animTime * 1.5,
            {
                duration: animTime * 1.5,
                stagger: {
                    each: speed,
                    onComplete: function () {
                        if (standingAnim)
                            standingAnim(target);
                    }
                },
                opacity: 0,
                scale: 5,
                rotation: -360,
                left: 150,
                ease: Power4.easeOut,
                onComplete: () => {
                    if (Theatre.DEBUG) console.log("completeAll");
                    if (textBox) {
                        textBox.style.setProperty("overflow-y", "scroll");
                        textBox.style.setProperty("overflow-x", "hidden");
                    }
                }
            }
        );
    }

    static do_vortex(
        target: HTMLElement,
        charSpans: any,
        animTime: number,
        speed: number,
        standingAnim: TextStandingAnimationFunction) {
        //let barTop = 0;
        //let barLeft = 0;
        let textBox: HTMLElement = null;
        if (charSpans[0]) {
            switch (Theatre.instance.settings.theatreStyle) {
                case "lightbox":
                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
                    if (!textBox)
                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                    break;
                case "clearbox":
                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
                    if (!textBox)
                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                    break;
                case "mangabubble":
                    break;
                case "textbox":
                default:
                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                    break;
            }
            if (textBox) {
                textBox.style.setProperty("overflow-y", "visible");
                textBox.style.setProperty("overflow-x", "visible");
            }
        }
        gsap.from(charSpans,
            {
                duration: animTime * 1.5,
                stagger: {
                    each: speed,
                    onComplete: function () {
                        if (standingAnim)
                            standingAnim(target);
                    }
                },
                opacity: 0,
                scale: 6,
                rotation: -1080,
                ease: Power4.easeOut,
                onComplete: () => {
                    if (Theatre.DEBUG) console.log("completeAll");
                    if (textBox) {
                        textBox.style.setProperty("overflow-y", "scroll");
                        textBox.style.setProperty("overflow-x", "hidden");
                    }
                }
            }
        );
    }

    static do_outlaw(
        target: HTMLElement,
        charSpans: any,
        animTime: number,
        speed: number,
        standingAnim: TextStandingAnimationFunction) {

        let textBox = null;
        if (charSpans[0]) {
            switch (Theatre.instance.settings.theatreStyle) {
                case "lightbox":
                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
                    if (!textBox)
                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                    break;
                case "clearbox":
                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
                    if (!textBox)
                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                    break;
                case "mangabubble":
                    break;
                case "textbox":
                default:
                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                    break;
            }
            if (textBox) {
                textBox.style.setProperty("overflow-y", "visible");
                textBox.style.setProperty("overflow-x", "visible");
            }
        }
        for (let idx = 0; idx < charSpans.length; ++idx) {
            TweenMax.from(charSpans[idx], animTime, {
                delay: idx * speed,
                opacity: 0,
                scale: 5,
                rotation: -720,
                left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 500}px`,
                top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 500}px`,
                onComplete: function () {
                    if (standingAnim)
                        standingAnim(target);
                }
            });
        }
        if (textBox) {
            if (Theatre.DEBUG) console.log("vortext all start");
            TweenMax.from(textBox, 0.1, {
                delay: (speed * charSpans.length) + animTime,
                //opacity: 1,
                onComplete: function () {
                    if (Theatre.DEBUG) console.log("vortex all complete");
                    if (target) {
                        target.style.setProperty("overflow-y", "scroll");
                        target.style.setProperty("overflow-x", "visible");
                    }
                }
            });
        }

    }

    static do_assemble(
        target: HTMLElement,
        charSpans: any,
        animTime: number,
        speed: number,
        standingAnim: TextStandingAnimationFunction) {

        for (let idx = 0; idx < charSpans.length; ++idx) {
            TweenMax.from(charSpans[idx], animTime, {
                delay: idx * speed,
                opacity: 0,
                scale: 5,
                rotation: -180,
                left: `${Math.random() * 500}px`,
                top: `${Math.random() * 500}px`,
                onComplete: function () {
                    if (standingAnim)
                        standingAnim(target);
                }
            });
        }
    }
}

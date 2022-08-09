import Theatre from "./Theatre.js";
import KHelpers from "./workers/KHelpers.js";

type SomeFun = (charSpans: any,
    animTime: any,
    speed: any,
    standingAnim: any) => void

type AnimationDef = {
    func: SomeFun;
    label: string;
}



export default class FlyinAnimationsFactory {

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
        FlyinAnimationsFactory.TYPEWRITER,
        FlyinAnimationsFactory.FADEIN,
        FlyinAnimationsFactory.SLIDE_IN,
        FlyinAnimationsFactory.SCALE_IN,
        FlyinAnimationsFactory.FALL_IN,
        FlyinAnimationsFactory.SPIN,
        FlyinAnimationsFactory.SPIN_SCALE,
        FlyinAnimationsFactory.OUTLAW,
        FlyinAnimationsFactory.VORTEX,
        FlyinAnimationsFactory.ASSEMBLE
    ]

    static get_all_animations(context: any, targets: any[]): { [key: string]: AnimationDef } {

        const result: { [key: string]: AnimationDef } = {};

        for (const name in this.ALL_ANIMATIONS) {
            result[name] = this.get_flyin_animation(name,
                context,
                targets);
        }

        return result;
    }

    static get_flyin_animation(
        name: string,
        context: any,
        targets: any[]): AnimationDef {
        switch (name) {
            case this.TYPEWRITER:
                return this.typewriter(context, targets);

            case this.FADEIN:
                return {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        gsap.from(charSpans, {
                            duration: animTime,
                            stagger: {
                                each: speed,
                                onComplete: function () {
                                    if (standingAnim)
                                        standingAnim.call(context, targets[0]);
                                }
                            },
                            opacity: 0,
                        });
                    },
                    label: game.i18n.localize("Theatre.Flyin.Fadein")
                };

            case this.SLIDE_IN:
                return {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        gsap.from(charSpans,
                            {
                                duration: animTime,
                                stagger: {
                                    each: speed,
                                    onComplete: function () {
                                        if (standingAnim)
                                            standingAnim.call(context, targets[0]);
                                    }
                                },
                                opacity: 0,
                                left: 200
                            }
                        );
                    },
                    label: game.i18n.localize("Theatre.Flyin.Slidein")
                };

            case this.SCALE_IN:
                return {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        gsap.from(charSpans,
                            {
                                duration: animTime,
                                stagger: {
                                    each: speed,
                                    onComplete: function () {
                                        if (standingAnim)
                                            standingAnim.call(context, targets[0]);
                                    }
                                },
                                opacity: 0,
                                scale: 5,
                                //rotation: -180,
                                ease: Power4.easeOut
                            }
                        );
                    },
                    label: game.i18n.localize("Theatre.Flyin.Scalein")
                };

            case this.FALL_IN:
                return {
                    func: function (charSpans, animTime, speed, standingAnim) {
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
                                            standingAnim.call(context, targets[0]);
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
                    },
                    label: game.i18n.localize("Theatre.Flyin.Fallin")
                };

            case this.SPIN:
                return {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        gsap.from(charSpans,
                            {
                                duration: animTime,
                                stagger: {
                                    each: speed,
                                    onComplete: function () {
                                        if (standingAnim)
                                            standingAnim.call(context, targets[0]);
                                    }
                                },
                                opacity: 0,
                                rotation: -360,
                                left: 100,
                                ease: Power4.easeOut
                            }
                        );
                    },
                    label: game.i18n.localize("Theatre.Flyin.Spin")
                };

            case this.SPIN_SCALE:
                return {
                    func: function (charSpans, animTime, speed, standingAnim) {
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
                                            standingAnim.call(context, targets[0]);
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
                    },
                    label: game.i18n.localize("Theatre.Flyin.SpinScale")
                };

            case this.OUTLAW:
                return {
                    func: function (charSpans, animTime, speed, standingAnim) {
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
                                            standingAnim.call(context, targets[0]);
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
                                        // shaking box
                                        //TweenMax.killTweensOf(charSpans[0].parentNode.parentNode); 
                                        //charSpans[0].parentNode.parentNode.style.top = `${barTop}px`; 
                                        //charSpans[0].parentNode.parentNode.style.left = `${barLeft}px`; 
                                    }
                                }
                            }
                        );
                    },
                    label: game.i18n.localize("Theatre.Flyin.Outlaw")
                };

            case this.VORTEX:
                return {
                    func: function (charSpans, animTime, speed, standingAnim) {

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
                                        standingAnim.call(context, targets[0])
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
                                    if (targets.length) {
                                        targets[0].style.setProperty("overflow-y", "scroll");
                                        targets[0].style.setProperty("overflow-x", "visible");
                                    }
                                }
                            });
                        }

                    },
                    label: game.i18n.localize("Theatre.Flyin.Vortex")
                };

            case this.ASSEMBLE:
                return {
                    func: function (charSpans, animTime, speed, standingAnim) {
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
                                        standingAnim.call(context, targets[0])
                                }
                            });
                        }
                    },
                    label: game.i18n.localize("Theatre.Flyin.Assemble")
                };
            default:
                return this.typewriter(context, targets);
        }


    }

    static typewriter(context: any,
        targets: any[]): AnimationDef {
        return {
            func: function (charSpans, animTime, speed, standingAnim) {
                gsap.from(charSpans, {
                    duration: 0.05,
                    stagger: {
                        each: 0.05,
                        onComplete: function () {
                            if (standingAnim)
                                standingAnim.call(context, targets[0]);
                        }
                    },
                    opacity: 0,
                    scale: 1.5
                });

            },
            label: game.i18n.localize("Theatre.Flyin.Typewriter")
        }
    }
}
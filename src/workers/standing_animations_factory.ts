
export type TextStandingAnimationFunction = (
    target: HTMLElement,
    ...args: any) => void

export type TextStandingAnimationDefinition = {
    func: TextStandingAnimationFunction;
    label: string;
}


export default class TextStandingAnimationsFactory {

    static IMPACT: "impact";
    static QUIVER: "quiver";
    static WAVE: "wave";
    static FADE: "fade";
    static EXCITED: "excited";
    static VIOLENT: "violent";
    static BUBBLY: "bubbly";
    static SPOOKY: "spooky";
    static INSANE: "insane";

    static ALL_ANIMATIONS: string[] = [
        TextStandingAnimationsFactory.IMPACT,
        TextStandingAnimationsFactory.QUIVER,
        TextStandingAnimationsFactory.WAVE,
        TextStandingAnimationsFactory.FADE,
        TextStandingAnimationsFactory.EXCITED,
        TextStandingAnimationsFactory.VIOLENT,
        TextStandingAnimationsFactory.BUBBLY,
        TextStandingAnimationsFactory.SPOOKY,
        TextStandingAnimationsFactory.INSANE
    ]

    static getAllAnimations(targets: HTMLElement[]): { [key: string]: TextStandingAnimationsFactory } {

        const result: { [key: string]: TextStandingAnimationsFactory } = {};

        for (const name in this.ALL_ANIMATIONS) {
            result[name] = this.getAnimationForName(name);
        }

        return result;
    }

    static getAnimationForName(name: string): TextStandingAnimationDefinition {

        switch (name) {

            case this.IMPACT:
                return {
                    func: this.do_impact,
                    label: game.i18n.localize("Theatre.Standing.Impact")
                };

            case this.QUIVER:
                return {
                    func: this.do_quiver,
                    label: game.i18n.localize("Theatre.Standing.Quiver")
                };

            case this.WAVE:

                return {
                    func: this.do_wave,
                    label: game.i18n.localize("Theatre.Standing.Wave")
                };

            case this.FADE:
                return {
                    func: this.do_fade,
                    label: game.i18n.localize("Theatre.Standing.Fade")
                };

            case this.EXCITED:
                return {
                    func: this.do_excited,
                    label: game.i18n.localize("Theatre.Standing.Excited")
                };
            case this.VIOLENT:
                return {
                    func: this.do_violent,
                    label: game.i18n.localize("Theatre.Standing.Violent")
                };

            case this.BUBBLY:
                return {
                    func: this.do_bubbly,
                    label: game.i18n.localize("Theatre.Standing.Bubbly")
                };

            case this.SPOOKY:
                return {
                    func: this.do_spooky,
                    label: game.i18n.localize("Theatre.Standing.Spooky")
                };
            case this.INSANE:

                return {
                    func: this.do_insane,
                    label: game.i18n.localize("Theatre.Standing.Insane")
                };

        };
    }

    static do_impact(target: HTMLElement, shakeradius?: number): void {

        if (!target)
            return;

        shakeradius = shakeradius || Math.random() * 7 + 7;
        shakeradius = Math.max(shakeradius - Math.random() * 0.5, 0);

        // Impact complete!
        if (shakeradius == 0) {
            target.style.left = "0px";
            target.style.top = "0px";
            return;
        }

        TweenMax.to(target, 0.025, {
            left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * shakeradius}px`,
            top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * shakeradius}px`,
            onComplete: this.do_impact,
            onCompleteParams: [target, shakeradius]
        });
    }

    static do_quiver(target: HTMLElement, quiverAmt?: number): void {

        if (!target)
            return;

        quiverAmt = quiverAmt || 2;
        quiverAmt = Math.max(quiverAmt - Math.random() * 0.1, 0);
        // Waver complete
        if (quiverAmt == 0) {
            target.style.left = "0px";
            target.style.top = "0px";
            return;
        }

        TweenMax.to(target, 0.1, {
            left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * quiverAmt}px`,
            top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * quiverAmt}px`,
            onComplete: this.do_quiver,
            onCompleteParams: [target, quiverAmt]
        });
    }

    static do_wave(target: HTMLElement, waveAmp?: number): void {

        if (!target)
            return;

        waveAmp = waveAmp || 4;
        if (waveAmp > 0)
            waveAmp = waveAmp - 0.5
        else
            waveAmp = waveAmp + 0.5

        // Waver complete
        if (waveAmp == 0) {
            target.style.top = "0px";
            return;
        }

        TweenMax.to(target, 0.5, {
            top: `${waveAmp}px`,
            onComplete: this.do_wave,
            onCompleteParams: [target, -waveAmp]
        });
    }

    static do_fade(target: HTMLElement, fade?: number) {

        if (!target)
            return;

        fade = fade || 1;
        fade = Math.max(fade - 0.025, 0);
        // fade complete
        if (fade <= 0) {
            target.style.opacity = "0";
            return;
        }

        TweenMax.to(target, 0.1, {
            opacity: fade,
            onComplete: this.do_fade,
            onCompleteParams: [target, fade]
        });
    }

    static do_excited(target: HTMLElement): void {

        if (!target)
            return;

        TweenMax.to(target, 0.025, {
            left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
            top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
            onComplete: this.do_excited,
            onCompleteParams: [target]
        });
    }


    static do_violent(
        target: HTMLElement,
        oshakeradius?: number,
        ox?: number,
        oy?: number): void {

        if (!target)
            return;

        ox = ox || 0;
        oy = oy || 0;
        oshakeradius = oshakeradius || 2;

        let shakeradius = Math.random() * oshakeradius + oshakeradius;
        if (!target.style.left.match("0px") || !target.style.top.match("0px"))
            shakeradius = 0;

        TweenMax.to(target, 0.025, {
            left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * shakeradius + ox}px`,
            top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * shakeradius + oy}px`,
            scale: `${Math.random() / 3 + 0.9}`,
            onComplete: this.do_violent,
            onCompleteParams: [target, oshakeradius, ox, oy]
        });
    }

    static do_bubbly(target: HTMLElement): void {

        if (!target)
            return;

        TweenMax.to(target, 0.5, {
            scale: `${Math.floor((Math.random() * 0.4 + 0.8) * 100) / 100}`,
            onComplete: this.do_bubbly,
            onCompleteParams: [target]
        });
    }

    static do_spooky(target: HTMLElement): void {

        if (!target)
            return;

        TweenMax.to(target, Math.floor((Math.random() * 0.25 + 0.2) * 100) / 100, {
            left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 3}px`,
            top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 3}px`,
            onComplete: this.do_spooky,
            onCompleteParams: [target]
        });

    }

    static do_insane(
        target: HTMLElement,
        rotation: number,
        scale: number): void {

        if (!target)
            return;

        let spin = (Math.random() * 100);
        let grow = (Math.random() * 200);
        let animtime = 0.025;
        rotation = rotation || 0;
        scale = scale || 1;

        if (spin >= 99.95) {
            animtime = Math.random() * 0.5;
            rotation = 1080;
        } else if (spin >= 99.8) {
            animtime = Math.random() * 0.5 + 0.5;
            rotation = 360;
        } else if (spin >= 80) {
            rotation = (rotation != 0 ? 0 : (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 30));
        }

        if (grow >= 199) {
            if (scale != 1)
                scale = 1;
            else
                scale = Math.random() * 0.5 + 1;
        }


        TweenMax.to(target, animtime, {
            left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
            top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
            rotation: rotation,
            scale: scale,
            onComplete: this.do_insane,
            onCompleteParams: [target, rotation, scale]
        });
    }
}
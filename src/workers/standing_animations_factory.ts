export type TextStandingAnimationFunction = (target: HTMLElement, ...args: any) => void;

export type TextStandingAnimationDefinition = {
	func: TextStandingAnimationFunction;
	label: string;
};

export type TextStandingAnimationDefinitionDictionary = { [key: string]: TextStandingAnimationDefinition };

export default class TextStandingAnimationsFactory {
	static IMPACT = "impact";
	static QUIVER = "quiver";
	static WAVE = "wave";
	static FADE = "fade";
	static EXCITED = "excited";
	static VIOLENT = "violent";
	static BUBBLY = "bubbly";
	static SPOOKY = "spooky";
	static INSANE = "insane";

	static ALL_ANIMATIONS: string[] = [
		TextStandingAnimationsFactory.IMPACT,
		TextStandingAnimationsFactory.QUIVER,
		TextStandingAnimationsFactory.WAVE,
		TextStandingAnimationsFactory.FADE,
		TextStandingAnimationsFactory.EXCITED,
		TextStandingAnimationsFactory.VIOLENT,
		TextStandingAnimationsFactory.BUBBLY,
		TextStandingAnimationsFactory.SPOOKY,
		TextStandingAnimationsFactory.INSANE,
	];

	static getDefinitions(): TextStandingAnimationDefinitionDictionary {
		const result: { [key: string]: TextStandingAnimationDefinition } = {};

		for (const name of this.ALL_ANIMATIONS) {
			result[name] = {
				func: <TextStandingAnimationFunction>this.getForName(name),
				label: game.i18n.localize("Theatre.Standing." + this.capitalizeFirstLetter(name)),
			};
		}

		return result;
	}

	/**
	 * @private
	 */
	static capitalizeFirstLetter(word: string) {
		return word.charAt(0).toUpperCase() + word.slice(1);
	}

	static getForName(name: string): TextStandingAnimationFunction | undefined {
		switch (name) {
			case this.IMPACT: {
				return this.do_impact;
			}
			case this.QUIVER: {
				return this.do_quiver;
			}
			case this.WAVE: {
				return this.do_wave;
			}
			case this.FADE: {
				return this.do_fade;
			}
			case this.EXCITED: {
				return this.do_excited;
			}
			case this.VIOLENT: {
				return this.do_violent;
			}
			case this.BUBBLY: {
				return this.do_bubbly;
			}
			case this.SPOOKY: {
				return this.do_spooky;
			}
			case this.INSANE: {
				return this.do_insane;
			}
			default: {
				return undefined;
			}
		}
	}

	static do_impact(target: HTMLElement, shakeradius?: number): void {
		if (!target) return;

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
			onComplete: TextStandingAnimationsFactory.do_impact,
			onCompleteParams: [target, shakeradius],
		});
	}

	static do_quiver(target: HTMLElement, quiverAmt?: number): void {
		if (!target) return;

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
			onComplete: TextStandingAnimationsFactory.do_quiver,
			onCompleteParams: [target, quiverAmt],
		});
	}

	static do_wave(target: HTMLElement, waveAmp?: number): void {
		if (!target) return;

		waveAmp = waveAmp || 4;
		if (waveAmp > 0) waveAmp = waveAmp - 0.5;
		else waveAmp = waveAmp + 0.5;

		// Waver complete
		if (waveAmp == 0) {
			target.style.top = "0px";
			return;
		}

		TweenMax.to(target, 0.5, {
			top: `${waveAmp}px`,
			onComplete: TextStandingAnimationsFactory.do_wave,
			onCompleteParams: [target, -waveAmp],
		});
	}

	static do_fade(target: HTMLElement, fade?: number) {
		if (!target) return;

		fade = fade || 1;
		fade = Math.max(fade - 0.025, 0);
		// fade complete
		if (fade <= 0) {
			target.style.opacity = "0";
			return;
		}

		TweenMax.to(target, 0.1, {
			opacity: fade,
			onComplete: TextStandingAnimationsFactory.do_fade,
			onCompleteParams: [target, fade],
		});
	}

	static do_excited(target: HTMLElement): void {
		if (!target) return;

		TweenMax.to(target, 0.025, {
			left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
			top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
			onComplete: TextStandingAnimationsFactory.do_excited,
			onCompleteParams: [target],
		});
	}

	static do_violent(target: HTMLElement, oshakeradius?: number, ox?: number, oy?: number): void {
		if (!target) return;

		ox = ox || 0;
		oy = oy || 0;
		oshakeradius = oshakeradius || 2;

		let shakeradius = Math.random() * oshakeradius + oshakeradius;
		if (!target.style.left.match("0px") || !target.style.top.match("0px")) shakeradius = 0;

		TweenMax.to(target, 0.025, {
			left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * shakeradius + ox}px`,
			top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * shakeradius + oy}px`,
			scale: `${Math.random() / 3 + 0.9}`,
			onComplete: TextStandingAnimationsFactory.do_violent,
			onCompleteParams: [target, oshakeradius, ox, oy],
		});
	}

	static do_bubbly(target: HTMLElement): void {
		if (!target) return;

		TweenMax.to(target, 0.5, {
			scale: `${Math.floor((Math.random() * 0.4 + 0.8) * 100) / 100}`,
			onComplete: TextStandingAnimationsFactory.do_bubbly,
			onCompleteParams: [target],
		});
	}

	static do_spooky(target: HTMLElement): void {
		if (!target) return;

		TweenMax.to(target, Math.floor((Math.random() * 0.25 + 0.2) * 100) / 100, {
			left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 3}px`,
			top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 3}px`,
			onComplete: TextStandingAnimationsFactory.do_spooky,
			onCompleteParams: [target],
		});
	}

	static do_insane(target: HTMLElement, rotation: number, scale: number): void {
		if (!target) return;

		let spin = Math.random() * 100;
		let grow = Math.random() * 200;
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
			rotation = rotation != 0 ? 0 : (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 30);
		}

		if (grow >= 199) {
			if (scale != 1) scale = 1;
			else scale = Math.random() * 0.5 + 1;
		}

		TweenMax.to(target, animtime, {
			left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
			top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
			rotation: rotation,
			scale: scale,
			onComplete: TextStandingAnimationsFactory.do_insane,
			onCompleteParams: [target, rotation, scale],
		});
	}
}

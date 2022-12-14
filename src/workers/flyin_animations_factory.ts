import TheatreSettings from "../extensions/TheatreSettings";
import Theatre from "../Theatre";
import TheatreStyle from "../types/TheatreStyle";
import KHelpers from "./KHelpers";
import type { TextStandingAnimationFunction } from "./standing_animations_factory";

export type Context = any;

export type TextFlyinAnimationFunction = (
	charSpans: any,
	animTime: number,
	speed: number,
	standingAnim: TextStandingAnimationFunction | null
) => void;

export type TextFlyinAnimationDefinition = {
	func: TextFlyinAnimationFunction;
	label: string;
};

export type TextFlyinAnimationDefinitions = { [key: string]: TextFlyinAnimationDefinition };

export default class TextFlyinAnimationsFactory {
	static TYPEWRITER = "typewriter";
	static FADEIN = "fadein";
	static SLIDE_IN = "slidein";
	static SCALE_IN = "scalein";
	static FALL_IN = "fallin";
	static SPIN = "spin";
	static SPIN_SCALE = "spinscale";
	static OUTLAW = "outlaw";
	static VORTEX = "vortex";
	static ASSEMBLE = "assemble";

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
		TextFlyinAnimationsFactory.ASSEMBLE,
	];

	static getDefinitions(): TextFlyinAnimationDefinitions {
		const result: TextFlyinAnimationDefinitions = {};

		for (const name of this.ALL_ANIMATIONS) {
			result[name] = {
				func: this.getForName(name),
				label: game.i18n.localize("Theatre.Flyin." + this.capitalizeFirstLetter(name)),
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
				return this.do_typewriter;
		}
	}

	static do_typewriter(
		charSpans: any,
		animTime: number,
		speed: number,
		standingAnim: TextStandingAnimationFunction | null
	): void {
		TweenMax.from(charSpans, {
			duration: 0.05,
			stagger: {
				each: 0.05,
				onComplete: function () {
					if (standingAnim) standingAnim((<gsap.TweenVars>this).targets()[0]);
				},
			},
			opacity: 0,
			scale: 1.5,
		});
	}

	static do_fade_in(
		charSpans: any,
		animTime: number,
		speed: number,
		standingAnim: TextStandingAnimationFunction | null
	) {
		TweenMax.from(charSpans, {
			duration: animTime,
			stagger: {
				each: speed,
				onComplete: function () {
					if (standingAnim) standingAnim((<gsap.TweenVars>this).targets()[0]);
				},
			},
			opacity: 0,
		});
	}

	static do_slide_in(
		charSpans: any,
		animTime: number,
		speed: number,
		standingAnim: TextStandingAnimationFunction | null
	) {
		TweenMax.from(charSpans, {
			duration: animTime,
			stagger: {
				each: speed,
				onComplete: function () {
					if (standingAnim) standingAnim((<gsap.TweenVars>this).targets()[0]);
				},
			},
			opacity: 0,
			left: 200,
		});
	}

	static do_scale_in = function (
		charSpans: any,
		animTime: number,
		speed: number,
		standingAnim: TextStandingAnimationFunction | null
	) {
		TweenMax.from(charSpans, {
			duration: animTime,
			stagger: {
				each: speed,
				onComplete: function () {
					if (standingAnim) standingAnim((<gsap.TweenVars>this).targets()[0]);
				},
			},
			opacity: 0,
			scale: 5,

			ease: Power4.easeOut,
		});
	};

	static do_fall_in(
		charSpans: any,
		animTime: number,
		speed: number,
		standingAnim: TextStandingAnimationFunction | null
	) {
		let textBox: HTMLElement | null = null;

		if (charSpans[0]) {
			switch (TheatreSettings.getTheatreStyle()) {
				case TheatreStyle.LIGHTBOX: {
					textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
					if (!textBox) {
						textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
					}
					break;
				}
				case TheatreStyle.CLEARBOX: {
					textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
					if (!textBox) {
						textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
					}
					break;
				}
				case TheatreStyle.MANGABUBBLE: {
					break;
				}
				case TheatreStyle.TEXTBOX:
				default: {
					textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
					break;
				}
			}
			if (textBox) {
				textBox.style.setProperty("overflow-y", "visible");
				textBox.style.setProperty("overflow-x", "visible");
			}
		}

		TweenMax.from(charSpans, {
			duration: animTime,
			stagger: {
				each: speed,
				onComplete: function () {
					if (standingAnim) standingAnim((<gsap.TweenVars>this).targets()[0]);
				},
			},
			opacity: 0,
			top: -100,
			ease: Power4.easeOut,
			onComplete: () => {
				if (textBox) {
					textBox.style.setProperty("overflow-y", "scroll");
					textBox.style.setProperty("overflow-x", "hidden");
				}
			},
		});
	}

	static do_spin(
		charSpans: any,
		animTime: number,
		speed: number,
		standingAnim: TextStandingAnimationFunction | null
	) {
		TweenMax.from(charSpans, {
			duration: animTime,
			stagger: {
				each: speed,
				onComplete: function () {
					if (standingAnim) standingAnim((<gsap.TweenVars>this).targets()[0]);
				},
			},
			opacity: 0,
			rotation: -360,
			left: 100,
			ease: Power4.easeOut,
		});
	}

	static do_spin_scale(
		charSpans: any,
		animTime: number,
		speed: number,
		standingAnim: TextStandingAnimationFunction | null
	) {
		let textBox: HTMLElement | null = null;
		if (charSpans[0]) {
			switch (TheatreSettings.getTheatreStyle()) {
				case TheatreStyle.LIGHTBOX: {
					textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
					if (!textBox) {
						textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
					}
					break;
				}
				case TheatreStyle.CLEARBOX: {
					textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
					if (!textBox) {
						textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
					}
					break;
				}
				case TheatreStyle.MANGABUBBLE: {
					break;
				}
				case TheatreStyle.TEXTBOX:
				default: {
					textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
					break;
				}
			}
			if (textBox) {
				textBox.style.setProperty("overflow-y", "visible");
				textBox.style.setProperty("overflow-x", "visible");
			}
		}

		TweenMax.from(charSpans, animTime * 1.5, {
			duration: animTime * 1.5,
			stagger: {
				each: speed,
				onComplete: function () {
					if (standingAnim) standingAnim((<gsap.TweenVars>this).targets()[0]);
				},
			},
			opacity: 0,
			scale: 5,
			rotation: -360,
			left: 150,
			ease: Power4.easeOut,
			onComplete: () => {
				if (textBox) {
					textBox.style.setProperty("overflow-y", "scroll");
					textBox.style.setProperty("overflow-x", "hidden");
				}
			},
		});
	}

	static do_vortex(
		charSpans: any,
		animTime: number,
		speed: number,
		standingAnim: TextStandingAnimationFunction | null
	) {
		let textBox: HTMLElement | null = null;
		if (charSpans[0]) {
			switch (TheatreSettings.getTheatreStyle()) {
				case TheatreStyle.LIGHTBOX: {
					textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
					if (!textBox) {
						textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
					}
					break;
				}
				case TheatreStyle.CLEARBOX: {
					textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
					if (!textBox) {
						textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
					}
					break;
				}
				case TheatreStyle.MANGABUBBLE: {
					break;
				}
				case TheatreStyle.TEXTBOX:
				default: {
					textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
					break;
				}
			}
			if (textBox) {
				textBox.style.setProperty("overflow-y", "visible");
				textBox.style.setProperty("overflow-x", "visible");
			}
		}

		TweenMax.from(charSpans, {
			duration: animTime * 1.5,
			stagger: {
				each: speed,
				onComplete: function () {
					if (standingAnim) standingAnim((<gsap.TweenVars>this).targets()[0]);
				},
			},
			opacity: 0,
			scale: 6,
			rotation: -1080,
			ease: Power4.easeOut,
			onComplete: () => {
				if (textBox) {
					textBox.style.setProperty("overflow-y", "scroll");
					textBox.style.setProperty("overflow-x", "hidden");
				}
			},
		});
	}

	static do_outlaw(
		charSpans: any,
		animTime: number,
		speed: number,
		standingAnim: TextStandingAnimationFunction | null
	) {
		let textBox = null;
		if (charSpans[0]) {
			switch (TheatreSettings.getTheatreStyle()) {
				case TheatreStyle.LIGHTBOX:
					textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
					if (!textBox) textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
					break;
				case TheatreStyle.CLEARBOX:
					textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
					if (!textBox) textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
					break;
				case TheatreStyle.MANGABUBBLE:
					break;
				case TheatreStyle.TEXTBOX:
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
					if (standingAnim) standingAnim(this.targets()[0]);
				},
			});
		}

		if (textBox) {
			TweenMax.from(textBox, 0.1, {
				delay: speed * charSpans.length + animTime,
				//opacity: 1,
				onComplete: function () {
					if (this.targets().length) {
						this.targets()[0].style.setProperty("overflow-y", "scroll");
						this.targets()[0].style.setProperty("overflow-x", "visible");
					}
				},
			});
		}
	}

	static do_assemble(
		charSpans: any,
		animTime: number,
		speed: number,
		standingAnim: TextStandingAnimationFunction | null
	) {
		for (let idx = 0; idx < charSpans.length; ++idx) {
			TweenMax.from(charSpans[idx], animTime, {
				delay: idx * speed,
				opacity: 0,
				scale: 5,
				rotation: -180,
				left: `${Math.random() * 500}px`,
				top: `${Math.random() * 500}px`,
				onComplete: function () {
					if (standingAnim) standingAnim(this.targets()[0]);
				},
			});
		}
	}
}

import TheatreSettings from "../../extensions/TheatreSettings";
import type Stage from "./Stage";

type Size = {
	width: number;
	height: number;
};

export default class Portrait {
	stage: Stage;
	// wraps portrait for easier mirroring
	portraitContainer?: PIXI.Container;
	portrait?: PIXI.Sprite;
	// wraps container of portrait for easier positioning
	// allows keeping scale out of calculations
	root: PIXI.Container;
	mirrored: boolean;

	get width() {
		return this.root.width;
	}

	get height() {
		return this.root.height;
	}

	/** Get X-Position of bottom left corner */
	get x() {
		return this.root.x;
	}

	/** Set X-Position of bottom left corner */
	set x(newX) {
		this.root.x = newX;
	}

	/** Get Y-Position of bottom left corner */
	get y() {
		return this.root.y;
	}

	/** Set S-Position of bottom left corner */
	set y(newY) {
		this.root.y = newY;
	}

	get scaleX() {
		return this.portraitContainer?.scale.x;
	}

	set scaleX(newScale) {
		(<PIXI.Container>this.portraitContainer).scale.x = <number>newScale;
	}

	get scaleY() {
		return this.portraitContainer?.scale.y;
	}

	set scaleY(newScale) {
		(<PIXI.Container>this.portraitContainer).scale.y = <number>newScale;
	}

	constructor(stage: Stage) {
		this.mirrored = false;
		this.root = new PIXI.Container();
		this.portraitContainer = new PIXI.Container();
		this.portrait = new PIXI.Sprite();
		this.stage = stage;
	}

	init() {
		this.root.addChild(<PIXI.Container>this.portraitContainer);
		this.portraitContainer?.addChild(<PIXI.Sprite>this.portrait);
		this.updateGeometry();
	}

	updateTexture(texture: PIXI.Texture, updateGeometry = false) {
		(<PIXI.Sprite>this.portrait).texture = <PIXI.Texture>texture;

		if (updateGeometry) this.updateGeometry();
	}

	destroy() {
		(<PIXI.Sprite>this.portrait).destroy();
		(<PIXI.Container>this.portraitContainer).destroy();
		this.portrait = undefined;
		this.portraitContainer = undefined;
	}

	updateGeometry() {
		const targetSize = this._calculatePortraitTargetSize();
		this._updateDimension(targetSize);
		this._updatePivot(targetSize);

		if (this.mirrored) {
			this.scaleX = -1;
		}
	}

	/** Updates size of portrait. */
	_updateDimension(targetSize: Size) {
		(<PIXI.Sprite>this.portrait).height = targetSize.height;
		(<PIXI.Sprite>this.portrait).width = targetSize.width;
	}

	/** Updates pivot of container to be in the middle. Has to be updated everytime because pivot changes */
	_updatePivot(targetSize: Size) {
		(<PIXI.Container>this.portraitContainer).pivot.x = targetSize.width / 2;
		(<PIXI.Container>this.portraitContainer).pivot.y = targetSize.height / 2;
		(<PIXI.Container>this.portraitContainer).x = targetSize.width / 2;
		(<PIXI.Container>this.portraitContainer).y = <number>targetSize.height / 2;
	}

	/**
	 * Calculates portrait target size according to the set target height.
	 */
	_calculatePortraitTargetSize(): Size {
		const texture = (<PIXI.Sprite>this.portrait).texture;

		if (!texture) console.error("OOF");

		const portWidth = (<PIXI.Sprite>this.portrait).texture.width;
		const portHeight = (<PIXI.Sprite>this.portrait).texture.height;

		const heightStr = TheatreSettings.getTheatreImageSize();

		let height: number;

		if (isNaN(heightStr as unknown as number)) {
			if (heightStr.endsWith("%")) {
				// => target height is relative to canvas size
				const relativeHeight = parseInt(heightStr.substring(0, heightStr.length - 1)) / 100;

				height = relativeHeight * this.stage.height;
			} else {
				// => target size does no have a legal string value
				ui.notifications.error(
					`Illegal value for: ${TheatreSettings.getNameLocalizationKey(TheatreSettings.THEATRE_IMAGE_SIZE)}`
				);
				height = TheatreSettings.THEATRE_IMAGE_SIZE_DEFAULT;
			}
		} else {
			// => target height is absolute
			height = parseInt(heightStr);
		}

		return {
			width: (height * portWidth) / portHeight,
			height: height,
		};
	}

	addEmote(emote: PIXI.Sprite) {
		(<PIXI.Container>this.portraitContainer).addChild(emote);
	}
}

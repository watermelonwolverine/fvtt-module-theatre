import type Stage from "../components/stage/Stage";
import TheatreSettings from "../extensions/TheatreSettings";
import type Theatre from "../Theatre";
import TheatreStyle from "../types/TheatreStyle";
import KHelpers from "./KHelpers";

export default class InsertReorderer {
	context: Theatre;
	stage: Stage;

	constructor(context: Theatre, stage: Stage) {
		this.context = context;
		this.stage = stage;
	}

	reorderInserts() {
		if (!this.context) return;

		let boxes = this.stage.getTextBoxes();
		let containerWidth = <number>this.stage.theatreDock?.offsetWidth;
		// Min 22px, max 32px, scale for all values inbetween
		let fontSize = Math.floor(Math.max((Math.min(containerWidth / boxes.length, 500) / 500) * 28, 18));

		for (let textBox_ of boxes) {
			const textBox = <HTMLElement>textBox_;
			let theatreId = <string>textBox.getAttribute("imgid");
			let insert = this.stage.getInsertById(theatreId);

			if (!insert) {
				this.context._removeTextBoxFromTheatreBar(textBox);
				continue;
			}
			// if somehow the containers are not setup, skip and hope the next re-order has them ready

			if (!insert.portrait || !insert.label) {
				continue;
			}
			// if the insert/textBox pair is in the process of being removed.
			if (textBox.getAttribute("deleting")) continue;

			//console.log("repositioning %s :",theatreId,insert);
			let offset = KHelpers.offset(textBox);
			//left calc
			let leftPos = Math.round(
				Number(offset.left || 0) -
					Number(KHelpers.style(textBox)["left"].match(/\-*\d+\.*\d*/) || 0) -
					Number(
						KHelpers.style(<HTMLDivElement>this.stage.theatreBar)
							.getPropertyValue("margin-left")
							.match(/\-*\d+\.*\d*/) || 0
					)
			);

			//insert.dockContainer.width = textBox.offsetWidth;

			if (insert.exitOrientation == "left") {
				if (
					leftPos + Number(insert.dockContainer?.width) / 2 >
					Number(this.stage.theatreBar?.offsetWidth) / 2
				) {
					insert.exitOrientation = "right";
				}
			} else {
				//right
				if (
					leftPos + Number(insert.dockContainer?.width) / 2 <=
					Number(this.stage.theatreBar?.offsetWidth) / 2
				) {
					insert.exitOrientation = "left";
				}
			}
			// pre-split measurement
			insert.label.style.fontSize = TheatreSettings.get("nameFontSize");
			insert.label.style.lineHeight = TheatreSettings.get<number>("nameFontSize") * 1.5;
			insert.label.style.wordWrap = false;
			insert.label.style.wordWrapWidth = insert.portrait.width;
			let labelExceeds = insert.label.width + 20 + insert.label.style.fontSize > textBox.offsetWidth;
			let preLabelWidth = insert.label.width;
			// split measurement
			insert.label.style.wordWrap = true;
			insert.label.style.wordWrapWidth = textBox.offsetWidth;
			// shrink if label exceeds
			if (labelExceeds) {
				// apply title font size
				let titleFontSize = Math.floor(Math.max((Math.min(containerWidth / boxes.length, 600) / 600) * 44, 28));
				insert.label.style.fontSize = titleFontSize;
				insert.label.style.lineHeight = titleFontSize * 1.5;
			}

			// Scale the name bar length and orient the portait

			if (insert.nameOrientation == "left") {
				insert.label.x = 20;
				insert.typingBubble.anchor.set(0.5);
				insert.typingBubble.x = Math.min(
					preLabelWidth + 20 + insert.typingBubble.width / 2,
					textBox.offsetWidth - insert.typingBubble.width / 2
				);
			} else {
				if (labelExceeds) {
					insert.label.x = insert.portrait.width - insert.label.width - 20;
					if (insert.label.width - 20 > insert.portrait.width)
						insert.typingBubble.x = Math.min(
							insert.portrait.width - insert.label.width - insert.typingBubble.texture.width / 2 - 20,
							insert.typingBubble.width / 2
						);
					else
						insert.typingBubble.x = Math.max(
							insert.portrait.width - insert.label.width - insert.typingBubble.texture.width / 2 - 20,
							insert.typingBubble.width / 2
						);
				} else {
					insert.label.x = insert.portrait.width - preLabelWidth - 20;
					if (preLabelWidth - 20 > insert.portrait.width)
						insert.typingBubble.x = Math.min(
							insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width / 2 - 20,
							insert.typingBubble.width / 2
						);
					else
						insert.typingBubble.x = Math.max(
							insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width / 2 - 20,
							insert.typingBubble.width / 2
						);
				}

				insert.typingBubble.anchor.set(0.5);

				leftPos += textBox.offsetWidth - insert.portrait.width;
			}
			insert.typingBubble.y =
				insert.portrait.height -
				(insert.optAlign == "top" ? 0 : Number(this.stage.theatreBar?.offsetHeight)) -
				insert.label.style.lineHeight +
				insert.typingBubble.height / 2;
			// if the label height > font-size, it word wrapped wrap, so we need to bump up the height
			if (labelExceeds) {
				let divisor = Math.round(insert.label.height / insert.label.style.lineHeight);
				insert.label.y =
					insert.portrait.height -
					(insert.optAlign == "top" ? 0 : Number(this.stage.theatreBar?.offsetHeight)) -
					insert.label.style.lineHeight * divisor;
			} else {
				// normal
				insert.label.y =
					insert.portrait.height -
					(insert.optAlign == "top" ? 0 : Number(this.stage.theatreBar?.offsetHeight)) -
					insert.label.style.lineHeight;
			}
			insert.typingBubble.rotation = 0.1745;
			(<PIXI.Container>insert.dockContainer).y =
				Number(this.stage.theatreDock?.offsetHeight) -
				(insert.optAlign == "top" ? Number(this.stage.theatreBar?.offsetHeight) : 0) -
				insert.portrait.height;

			// theatreStyle specific adjustments
			switch (TheatreSettings.getTheatreStyle()) {
				case TheatreStyle.LIGHTBOX: {
					// to allow top-aligned portraits to work without a seam
					(<PIXI.Container>insert.dockContainer).y += insert.optAlign == "top" ? 8 : 0;
					insert.label.y -= insert.optAlign == "top" ? 8 : 0;
					break;
				}
				case TheatreStyle.CLEARBOX: {
					(<PIXI.Container>insert.dockContainer).y = Number(this.stage.theatreDock?.offsetHeight) - insert.portrait.height;
					insert.label.y += insert.optAlign == "top" ? 0 : Number((<HTMLDivElement>this.stage.theatreBar).offsetHeight);
					insert.typingBubble.y += insert.optAlign == "top" ? 0 : Number((<HTMLDivElement>this.stage.theatreBar).offsetHeight);
					break;
				}
				case TheatreStyle.MANGABUBBLE: {
					break;
				}
				case TheatreStyle.TEXTBOX: {
					break;
				}
				default:
					break;
			}

			// Based on the number of active inserts, space, and user /desired/ font size, we'll set the font size
			let insertFontSize = fontSize;
			textBox.setAttribute("osize", insertFontSize.toString());
			switch (Number(insert.emotion.textSize)) {
				case 3:
					insertFontSize *= 1.5;
					break;
				case 1:
					insertFontSize *= 0.5;
					break;
				default:
					break;
			}
			textBox.style.setProperty("font-size", `${insertFontSize}px`);

			const firstChild = <HTMLElement>textBox.children[0];
			// now apply it to all children and sub child heights if the height is different
			// note that we only care about growing, not shrinking to conserve a bit.
			if (firstChild && firstChild.tagName.toLowerCase() != "hr" && firstChild.offsetHeight != insertFontSize) {
				for (let child of textBox.children) {
					if (child.tagName.toLowerCase() == "hr") continue;
					for (let grandchild of child.children)
						(<HTMLElement>grandchild).style.height = `${insertFontSize}px`;
					(<HTMLElement>child).style.height = `${insertFontSize}px`;
				}
			}
			// bookmark leftPos as order for sorting
			insert.order = leftPos;
			insert.renderOrder = leftPos;

			const tweenId = "containerSlide";
			const context = this.context;

			let tween = TweenMax.to((<PIXI.Container>insert.dockContainer), 1, {
				//delay: 0.5,
				pixi: { x: leftPos, alpha: 1 },
				ease: Power4.easeOut,
				onComplete: function (imgId, tweenId) {
					// decrement the rendering accumulator
					context._removeDockTween(imgId, this, tweenId);
					// remove our own reference from the dockContainer tweens
				},
				onCompleteParams: [insert.imgId, tweenId],
			});

			this.context._addDockTween(theatreId, tween, tweenId);
		}
		// sort the render order by left position order
		this.stage.stageInserts.sort((a, b) => {
			return a.order - b.order;
		});
	}
}

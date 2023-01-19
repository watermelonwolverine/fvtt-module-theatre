/* eslint-disable no-unused-vars */
import TheatreSettings from "../extensions/TheatreSettings";
import type Theatre from "../Theatre";
import TheatreStyle from "../types/TheatreStyle";
import KHelpers from "./KHelpers";
import type SceneEventProcessor from "./SceneEventProcessor";
import TextBoxMouseEventHandler from "./TextBoxMouseEventHandler";

export default class TextBoxFactory {
	mouseEventHandler: TextBoxMouseEventHandler;
	theatre: Theatre;

	constructor(theatre: Theatre, sceneEventProcessor: SceneEventProcessor) {
		this.theatre = theatre;

		this.mouseEventHandler = new TextBoxMouseEventHandler(theatre, sceneEventProcessor);
	}

	createTextbox(portName: string, imgId: string) {
		const textBox = document.createElement("div");
		// textBox class + style depends on our display mode
		switch (TheatreSettings.getTheatreStyle()) {
			case TheatreStyle.LIGHTBOX: {
				KHelpers.addClass(textBox, "theatre-text-box-light");
				break;
			}
			case TheatreStyle.CLEARBOX: {
				KHelpers.addClass(textBox, "theatre-text-box-clear");
				break;
			}
			case TheatreStyle.MANGABUBBLE: {
				break;
			}
			case TheatreStyle.TEXTBOX:
			default: {
				KHelpers.addClass(textBox, "theatre-text-box");
				break;
			}
		}
		KHelpers.addClass(textBox, "no-scrollbar");

		portName = portName.toLowerCase();

		textBox.setAttribute("name", portName);
		textBox.setAttribute("imgid", imgId);
		textBox.style.opacity = "0";

		this.theatre.applyFontFamily(textBox, this.theatre.textFont);

		this.mouseEventHandler.addListeners(textBox);

		return textBox;
	}
}

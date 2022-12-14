/* eslint-disable no-unused-vars */
import type Theatre from "../Theatre";
import _TheatrePixiContainerFactory from "./pixi_container_factory";
import TheatrePortraitContainerSetupWorker from "./portrait_container_setup";
import type TextBoxFactory from "./textbox_factory";

export default class _TheatreWorkers {
	pixi_container_factory: _TheatrePixiContainerFactory;
	portrait_container_setup_worker: TheatrePortraitContainerSetupWorker;
	textbox_factory: TextBoxFactory;

	constructor(theatre: Theatre) {
		this.portrait_container_setup_worker = new TheatrePortraitContainerSetupWorker(theatre);
		this.pixi_container_factory = new _TheatrePixiContainerFactory(theatre, this.portrait_container_setup_worker);
	}
}

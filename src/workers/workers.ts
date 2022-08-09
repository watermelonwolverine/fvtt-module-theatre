/* eslint-disable no-unused-vars */
import _TheatrePixiContainerFactory from "./pixi_container_factory.js";
import _TheatrePortraitContainerSetupWorker from "./portrait_container_setup.js";
import _TextBoxFactory from "./textbox_factory.js";
import Theatre from "../Theatre.js";

export default class _TheatreWorkers {
    pixi_container_factory: _TheatrePixiContainerFactory;
    portrait_container_setup_worker: _TheatrePortraitContainerSetupWorker;
    textbox_factory: _TextBoxFactory;


    constructor(context: Theatre) {
        this.pixi_container_factory = new _TheatrePixiContainerFactory(context, this);
        this.portrait_container_setup_worker = new _TheatrePortraitContainerSetupWorker(context, this);
        this.textbox_factory = new _TextBoxFactory(context, this);
    }

}
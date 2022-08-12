/* eslint-disable no-unused-vars */
import _TheatrePixiContainerFactory from "./pixi_container_factory";
import _TheatrePortraitContainerSetupWorker from "./portrait_container_setup";
import _TextBoxFactory from "./textbox_factory";
import Theatre from "../Theatre";

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
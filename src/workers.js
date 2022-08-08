class _TheatreWorkers{

    /**
     * @param {Theatre} context
     */
    constructor(context){
        this.pixi_container_factory = new _TheatrePixiContainerFactory(context, this);
        this.portrait_container_setup_worker = new _TheatrePortraitContainerSetupWorker(context, this);
        this.textbox_factory = new _TextBoxFactory(context, this);
    }

}
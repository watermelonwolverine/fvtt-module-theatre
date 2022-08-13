import TheatreSettings from "../extensions/settings";
import Stage from "./Stage";
import StageInsert from "./StageInsert";

export default class Portrait {

    stage: Stage;
    insert: StageInsert;

    constructor(stage: Stage,
        insert: StageInsert) {
        this.stage = stage;
        this.insert = insert;
    }

    updatePortrait() {
        const dimensions = this.calculatePortraitDimensions();
        this._updatePortraitDimensions(dimensions)
        this._updatePortraitPosition(dimensions)
        this._updatePivot()
        // set mirror state if mirrored
        if (this.insert.mirrored) {
            this.insert.portraitContainer.scale.x = -1;
        }
    }

    _updatePortraitDimensions(portraitDimensions = this.calculatePortraitDimensions()) {

        const width = portraitDimensions.width;
        const height = portraitDimensions.height;
        this.insert.portrait.height = height;
        this.insert.portrait.width = width;
    }

    _updatePivot() {
        const container = this.insert.portraitContainer;
        container.pivot.x = container.width / 2;
        container.pivot.y = container.height / 2;
    }

    /** @private */
    _updatePortraitPosition(portraitDimensions = this.calculatePortraitDimensions()) {

        this.insert.portraitContainer.x = this.insert.portraitContainer.x + portraitDimensions.width / 2;
        this.insert.portraitContainer.y = this.insert.portraitContainer.y + portraitDimensions.height / 2;
        this.insert.dockContainer.y = this.stage.theatreDock.offsetHeight - (this.insert.optAlign == "top" ? this.stage.theatreBar.offsetHeight : 0) - portraitDimensions.height;
    }

    calculatePortraitDimensions(): { width: number, height: number } {

        const texture = this.insert.portrait.texture;

        if (!texture)
            console.error("OOF");

        const portWidth = this.insert.portrait.texture.width;
        const portHeight = this.insert.portrait.texture.height;

        const heightStr = TheatreSettings.getTheatreImageSize();

        let height: number;

        if (isNaN(heightStr as unknown as number)) {
            if (heightStr.endsWith("%")) {

                const relativeHeight = parseInt(
                    heightStr.substring(0, heightStr.length - 1)
                ) / 100;

                height = relativeHeight * this.stage.pixiApplication.renderer.height;
            }
            else {
                ui.notifications.error(`Illegal value for: ${TheatreSettings.getNameLocalizationKey(TheatreSettings.THEATRE_IMAGE_SIZE)}`);
                height = TheatreSettings.THEATRE_IMAGE_SIZE_DEFAULT;
            }
        }
        else {
            height = parseInt(heightStr);
        }

        return {
            width: height * portWidth / portHeight,
            height: height
        };

    }

}
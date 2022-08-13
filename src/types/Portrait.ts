import TheatreSettings from "../extensions/settings";
import Stage from "./Stage";
import StageInsert from "./StageInsert";
import TheatreStyle from "./TheatreStyle";

export default class Portrait {

    stage: Stage;
    insert: StageInsert;

    constructor(stage: Stage,
        insert: StageInsert) {
        this.stage = stage;
        this.insert = insert;
    }

    updatePortrait() {
        const portraitDimensions = this.calculatePortraitDimensions();
        this.updatePortraitDimensions(portraitDimensions)
        this._updatePortraitPosition(portraitDimensions)
        // set mirror state if mirrored
        if (this.insert.mirrored) {
            this.insert.portraitContainer.scale.x = -1;
        }
    }

    updatePortraitDimensions(portraitDimensions = this.calculatePortraitDimensions()) {

        const portWidth = portraitDimensions.width;
        const portHeight = portraitDimensions.height;

        // IMPORTANT: the order is important and can not be changed
        this.insert.portraitContainer.width = portWidth
        this.insert.portraitContainer.height = portHeight
        this.insert.dockContainer.width = portWidth
        this.insert.dockContainer.height = portHeight
    }

    /** @private */
    _updatePortraitPosition(portraitDimensions = this.calculatePortraitDimensions()) {
        this.insert.portraitContainer.pivot.x = portraitDimensions.width / 2;
        this.insert.portraitContainer.pivot.y = portraitDimensions.height / 2;
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
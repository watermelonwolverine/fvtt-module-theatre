import TheatreSettings from "../extensions/settings";
import Stage from "./Stage";
import StageInsert from "./StageInsert";

type Size = {
    width: number,
    height: number
}

export default class Portrait {

    stage: Stage;
    insert: StageInsert;

    constructor(stage: Stage,
        insert: StageInsert) {
        this.stage = stage;
        this.insert = insert;
    }

    initPortrait() {
        this.updatePortrait();
    }

    updatePortrait() {

        this.insert.portraitContainer.scale.x = 1;

        const targetSize = this._calculatePortraitTargetSize();
        this._updateDimensions(targetSize);
        this._updatePivots(targetSize);
        this._updatePositions(targetSize);

        if (this.insert.mirrored) {
            this.insert.portraitContainer.scale.x = -1;
        }
    }

    /** Updates size of portrait. */
    _updateDimensions(targetSize: Size) {
        this.insert.portrait.height = targetSize.height;
        this.insert.portrait.width = targetSize.width;
    }

    /** Updates pivot of container to be in the middle. Has to be updated everytime because pivot changes */
    _updatePivots(targetSize: Size) {
        this.insert.portraitContainer.pivot.x = targetSize.width / 2;
        this.insert.portraitContainer.pivot.y = targetSize.height / 2;
    }

    /** Updates position of container. Has to be updated everytime because pivot or size changes */
    _updatePositions(targetSize: Size) {
        this.insert.portraitContainer.x = targetSize.width / 2;
        this.insert.portraitContainer.y = targetSize.height / 2;
    }

    /**
     * Calculates portrait target size according to the set target height.  
     */
    _calculatePortraitTargetSize(): Size {

        const texture = this.insert.portrait.texture;

        if (!texture)
            console.error("OOF");

        const portWidth = this.insert.portrait.texture.width;
        const portHeight = this.insert.portrait.texture.height;

        const heightStr = TheatreSettings.getTheatreImageSize();

        let height: number;

        
        if (isNaN(heightStr as unknown as number)) {
            if (heightStr.endsWith("%")) {
                // => target height is relative to canvas size
                const relativeHeight = parseInt(
                    heightStr.substring(0, heightStr.length - 1)
                ) / 100;

                height = relativeHeight * this.stage.pixiApplication.renderer.height;
            }
            else {
                // => target size does no have a legal string value
                ui.notifications.error(`Illegal value for: ${TheatreSettings.getNameLocalizationKey(TheatreSettings.THEATRE_IMAGE_SIZE)}`);
                height = TheatreSettings.THEATRE_IMAGE_SIZE_DEFAULT;
            }
        }
        else {
            // => target height is absolute
            height = parseInt(heightStr);
        }

        return {
            width: height * portWidth / portHeight,
            height: height
        };

    }

}
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

    getPortraitDimensions(): { width: number, height: number } {

        const texture = this.insert.portrait.texture;

        if(!texture)
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
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

    updatePortraitDimensions() {

        const dimensions = this.getPortraitDimensions();

        const insert = this.insert;

        const portWidth = dimensions.width;
        const portHeight = dimensions.height;

        const stage = this.stage;
        const dockContainer = this.insert.dockContainer;
        const portraitContainer = this.insert.portraitContainer;

        // adjust dockContainer + portraitContainer dimensions to fit the image
        dockContainer.width = portWidth
        dockContainer.height = portHeight
        portraitContainer.width = portWidth
        portraitContainer.height = portHeight

        dockContainer.y = stage.theatreDock.offsetHeight - (insert.optAlign == "top" ? stage.theatreBar.offsetHeight : 0) - portHeight;

        // save and stage our sprite

        insert.portrait.width = portWidth;
        insert.portrait.height = portHeight;

        portraitContainer.pivot.x = portWidth / 2;
        portraitContainer.pivot.y = portHeight / 2;
        portraitContainer.x = portraitContainer.x + portWidth / 2;
        portraitContainer.y = portraitContainer.y + portHeight / 2;

        insert.label.style.wordWrapWidth = portWidth;

        insert.label.y =
            portHeight - (insert.optAlign == "top" ? 0 : stage.theatreBar.offsetHeight) - insert.label.style.lineHeight - 20;

        insert.typingBubble.y =
            portHeight - (insert.optAlign == "top" ? 0 : stage.theatreBar.offsetHeight) - insert.label.style.lineHeight + insert.typingBubble.height / 2;


        switch (TheatreSettings.getTheatreStyle()) {
            case TheatreStyle.LIGHTBOX:
                // to allow top-aligned portraits to work without a seam
                dockContainer.y += (insert.optAlign == "top" ? 8 : 0);
                insert.label.y -= (insert.optAlign == "top" ? 8 : 0);
                break;
            case TheatreStyle.CLEARBOX:
                dockContainer.y = stage.theatreDock.offsetHeight - portHeight;
                insert.label.y += (insert.optAlign == "top" ? 0 : stage.theatreBar.offsetHeight);
                insert.typingBubble.y += (insert.optAlign == "top" ? 0 : stage.theatreBar.offsetHeight);
                break;
            case TheatreStyle.MANGABUBBLE:
                break;
            case TheatreStyle.TEXTBOX:
                break;
            default:
                break;
        }
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
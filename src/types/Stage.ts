import Theatre from "../Theatre.js";
import PortraitDock from "./PortraitDock.js"
import TheatreActor from "./TheatreActor.js"

export default class Stage {

    actors: {
        [key: string]: TheatreActor
    };

    portraitDocks: PortraitDock[];

    constructor() {
        this.actors = {};
        this.portraitDocks = [];
    }

    /**
     * Removes insert by ID
     *
     * @params id (String) : The theatreId of the insert to remove.
     * @params remote (Boolean) : Boolean indicating if this is being invoked remotely, or locally. 
     *
     * @return (Object) : An object containing the items that were removed {insert : (Object), textBox: (HTMLElement)}
     *					 or null if there was nothing to remove. 
     */
    removeInsertById(
        imgId: string,
        remote?: boolean) {

        let toRemoveInsert: PortraitDock;
        let toRemoveTextBox: HTMLElement;

        for (const insert of this.portraitDocks) {
            if (insert.imgId == imgId && !insert.deleting) {
                insert.deleting = true;
                toRemoveInsert = insert;
                break;
            }
        }

        for (const textBox  of Theatre.instance._getTextBoxes()) {
            if (textBox.getAttribute("imgId") == imgId && !textBox.getAttribute("deleting")) {
                textBox.setAttribute("deleting", "true");
                toRemoveTextBox =<HTMLElement>textBox;
                break;
            }
        }

        if (toRemoveInsert && !toRemoveTextBox ||
            !toRemoveInsert && toRemoveTextBox)
            logger.error("OOF")

        if (!toRemoveInsert || !toRemoveTextBox)
            return null;

        return Theatre.instance._removeInsert(
            toRemoveInsert,
            toRemoveTextBox,
            remote);
    }
}
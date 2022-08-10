import PortraitDock from "./PortraitDock.js"
import TheatreActor from "./TheatreActor.js"

export default class Stage {
    
    actors: {
        [key: string]: TheatreActor
    };

    portraitDocks: PortraitDock[];
}
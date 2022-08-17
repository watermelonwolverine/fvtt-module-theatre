import ActorExtensions from "../extensions/ActorExtensions";
import EmotionDefinition from "../types/EmotionDefinition";
import Params from "../types/Params";

const THEATRE_PREFIX = "theatre-"

export default class Tools {

    static getTheatreId(actor: Actor | ActorData): string {
        return THEATRE_PREFIX + actor._id;
    }

    static toActorId(theatreId: string) {
        return theatreId.replace(THEATRE_PREFIX, "");
    }

    /**
     * Pull insert theatre parameters from an actor if possible
     *
     * @param actorId (String) : The actor Id from which to pull theatre insert data from
     *
     * @return (Object) : An object containing the parameters of the insert given the actor Id
     *					 or null.
        */
    static getInsertParamsFromActorId(actorId: string): Params {

        let actor: Actor = game.actors.get(actorId);

        if (!actor) {
            console.log("ERROR, ACTOR %s DOES NOT EXIST!", actorId);
            return null;
        }

        const actorData : ActorData= actor.data;

        let theatreId = `theatre-${actorData._id}`;
        let portrait = (actorData.img ? actorData.img : "icons/mystery-man.png");
        let optAlign = "top";
        let name = ActorExtensions.getDisplayName(actorData._id);
        let emotes = {};
        let settings = new EmotionDefinition();

        // Use defaults incase the essential flag attributes are missing
        if (actorData.flags.theatre) {
            if (actorData.flags.theatre.name && actorData.flags.theatre.name != "")
                name = actorData.flags.theatre.name;
            if (actorData.flags.theatre.baseinsert && actorData.flags.theatre.baseinsert != "")
                portrait = actorData.flags.theatre.baseinsert;
            if (actorData.flags.theatre.optalign && actorData.flags.theatre.optalign != "")
                optAlign = actorData.flags.theatre.optalign;
            if (actorData.flags.theatre.emotes)
                emotes = actorData.flags.theatre.emotes;
            if (actorData.flags.theatre.settings)
                settings = actorData.flags.theatre.settings;
        }

        return {
            src: portrait,
            name: name,
            optalign: optAlign,
            imgId: theatreId,
            emotes: emotes,
            settings: settings
        };

    }
}

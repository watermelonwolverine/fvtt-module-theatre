import ActorExtensions from "../extensions/ActorExtensions";
import Params from "../types/Params";

const THEATRE_PREFIX = "theatre-"

export default class Tools {

    static getTheatreId(actor: Actor) {
        return THEATRE_PREFIX + actor._id;
    }

    /**
     * Pull insert theatre parameters from an actor if possible
     *
     * @param actorId (String) : The actor Id from which to pull theatre insert data from
     *
     * @return (Object) : An object containing the parameters of the insert given the actor Id
     *					 or null.
        */
    static getInsertParamsFromActorId(actorId: string) : Params {

        let actor = game.actors.get(actorId);

        if (!actor) {
            console.log("ERROR, ACTOR %s DOES NOT EXIST!", actorId);
            return null;
        }

        actor = actor.data;
        //console.log("getting params from actor: ",actor); 

        let theatreId = `theatre-${actor._id}`;
        let portrait = (actor.img ? actor.img : "icons/mystery-man.png");
        let optAlign = "top";
        let name = ActorExtensions.getDisplayName(actor._id);
        let emotes = {};
        let settings = {};

        // Use defaults incase the essential flag attributes are missing
        if (actor.flags.theatre) {
            if (actor.flags.theatre.name && actor.flags.theatre.name != "")
                name = actor.flags.theatre.name;
            if (actor.flags.theatre.baseinsert && actor.flags.theatre.baseinsert != "")
                portrait = actor.flags.theatre.baseinsert;
            if (actor.flags.theatre.optalign && actor.flags.theatre.optalign != "")
                optAlign = actor.flags.theatre.optalign;
            if (actor.flags.theatre.emotes)
                emotes = actor.flags.theatre.emotes;
            if (actor.flags.theatre.settings)
                settings = actor.flags.theatre.settings;
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

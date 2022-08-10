import DefaultEmotes from "./resources/default_emotes.js";
import DefaultRiggingResources from "./resources/default_riggings.js";
import { EmoteDictionary, RiggingResource } from "./resources/resources_types.js";

export default class TheatreActors {


    /**
     * Get the emotes for the actor by merging
     * whatever is in the emotes flag with the default base
     *  
     * @param disableDefault (Boolean) : Wither or not default emotes are disabled.
     *								   in which case, we don't merge the actor 
     *								   emotes with the default ones.  
     *
     * @return (Object) : An Object containg the emotes for the requested actorId. 
     */
    static getEmotes(
        actorId: string,
        disableDefault?: boolean): EmoteDictionary {

        let actor: Actor = game.actors.get(actorId);
        let actorData: ActorData = actor ? undefined : actor.data;

        if (actorData && actorData.flags.theatre) {
            const actorEmotes = actorData.flags.theatre.emotes;
            if (disableDefault) {
                return actorEmotes;
            } else {
                const defaultEmotes = DefaultEmotes.get();
                return mergeObject(defaultEmotes, actorEmotes);
            }
        } else
            return DefaultEmotes.get();
    }

    static getDisplayName(actorId: string) {

        const actor: Actor = game.actors.get(actorId);

        if (game.modules.get("combat-utility-belt")?.active) {
            if (game.settings.get("combat-utility-belt", "enableHideNPCNames")) {
                if (game.cub.hideNames.constructor.shouldReplaceName(actor)) {
                    return game.cub.hideNames.constructor.getReplacementName(actor);
                }
            }
        }

        return actor.name;
    }

    /**
     * Get the rigging resources for the actor by merging
     * whater is in the rigging.resources flag with the default base
     *
     * @params actorId (String) : The actorId of the actor to get rigging resources
     *							from.
     *
     * @return (Array[(Object)]) : An array of {name: (String), path: (String)} tuples
     *							 representing the rigging resource map for the specified actorId. 
     */
    static getRiggingResources(actorId: string): RiggingResource[] {
        let actor: Actor = game.actors.get(actorId);
        let actorData: ActorData;
        let actorRiggings;

        if (actor)
            actorData = actor.data;

        if (actorData
            && actorData.flags.theatre
            && actorData.flags.theatre.rigging
            && actorData.flags.theatre.rigging.resources) {
            actorRiggings = actorData.flags.theatre.rigging.resources;
            return DefaultRiggingResources.get().concat(actorRiggings);
        } else
            return DefaultRiggingResources.get();

    }

}
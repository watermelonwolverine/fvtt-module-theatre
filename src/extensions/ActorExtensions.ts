import DefaultEmotes from "../resources/default_emotes";
import DefaultRiggingResources from "../resources/default_riggings";
import type { EmoteDictionary, RiggingResource } from "../resources/resources_types";

export default class ActorExtensions {
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
	static getEmotesForActor(actorId: string, disableDefault?: boolean): EmoteDictionary {
		const actor: Actor | undefined = game.actors?.get(actorId);
		// const actorData: ActorData = actor ? actor.data : undefined;
		const actorData: Actor | undefined = actor ? actor : undefined;
		//@ts-ignore
		if (actorData && actorData.flags.theatre) {
			//@ts-ignore
			const actorEmotes = actorData.flags.theatre.emotes;
			if (disableDefault) {
				return actorEmotes;
			} else {
				const defaultEmotes = DefaultEmotes.get();
				return mergeObject(defaultEmotes, actorEmotes);
			}
		} else return DefaultEmotes.get();
	}

	static getDisplayName(actorId: string) {
		const actor: Actor | undefined = game.actors?.get(actorId);

		if (game.modules.get("combat-utility-belt")?.active) {
			if (game.settings.get("combat-utility-belt", "enableHideNPCNames")) {
				if (game.cub.hideNames.constructor.shouldReplaceName(actor)) {
					return game.cub.hideNames.constructor.getReplacementName(actor);
				}
			}
		}

		return actor?.name;
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
		const actor: Actor | undefined = game.actors?.get(actorId);
		const actorData: Actor | undefined = actor ? actor : undefined;

		if (
			actorData &&
			//@ts-ignore
			actorData.flags.theatre &&
			//@ts-ignore
			actorData.flags.theatre.rigging &&
			//@ts-ignore
			actorData.flags.theatre.rigging.resources
		) {
			//@ts-ignore
			const actorRiggings = actorData.flags.theatre.rigging.resources;
			return DefaultRiggingResources.get().concat(actorRiggings);
		} else return DefaultRiggingResources.get();
	}
}

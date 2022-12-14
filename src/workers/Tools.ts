import ActorExtensions from "../extensions/ActorExtensions";
import EmotionDefinition from "../types/EmotionDefinition";
import type Params from "../types/Params";

const THEATRE_PREFIX = "theatre-";

export default class Tools {
	static getTheatreId(actor: Actor): string {
		return THEATRE_PREFIX + <string>actor.id;
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
	static getInsertParamsFromActorId(actorId: string): Params | null {
		let actor: Actor = <Actor>game.actors?.get(actorId);

		if (!actor) {
			console.log("ERROR, ACTOR %s DOES NOT EXIST!", actorId);
			return null;
		}

		const actorData: Actor = actor;

		let theatreId = `theatre-${actorData.id}`;
		let portrait = actorData.img ? <string>actorData.img : "icons/mystery-man.png";
		let optAlign = "top";
		let name = ActorExtensions.getDisplayName(<string>actorData.id);
		let emotes = {};
		let settings = new EmotionDefinition();

		// Use defaults incase the essential flag attributes are missing
		//@ts-ignore
		if (actorData.flags.theatre) {
			//@ts-ignore
			if (actorData.flags.theatre.name && actorData.flags.theatre.name != "") {
				//@ts-ignore
				name = actorData.flags.theatre.name;
			}
			//@ts-ignore
			if (actorData.flags.theatre.baseinsert && actorData.flags.theatre.baseinsert != "") {
				//@ts-ignore
				portrait = actorData.flags.theatre.baseinsert;
			}
			//@ts-ignore
			if (actorData.flags.theatre.optalign && actorData.flags.theatre.optalign != "") {
				//@ts-ignore
				optAlign = actorData.flags.theatre.optalign;
			}
			//@ts-ignore
			if (actorData.flags.theatre.emotes) {
				//@ts-ignore
				emotes = actorData.flags.theatre.emotes;
			}
			//@ts-ignore
			if (actorData.flags.theatre.settings) {
				//@ts-ignore
				settings = actorData.flags.theatre.settings;
			}
		}

		return {
			src: portrait,
			name: name,
			optalign: optAlign,
			imgId: theatreId,
			emotes: emotes,
			settings: settings,
		};
	}
}

export default class TheatreActor {
	actorData: Actor;
	navElement: HTMLElement;

	constructor(actor: Actor, navElement: HTMLElement) {
		this.actorData = actor;
		this.navElement = navElement;
	}
}

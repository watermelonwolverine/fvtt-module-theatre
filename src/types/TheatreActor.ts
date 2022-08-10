export default class TheatreActor {

    actor: Actor;
    navElement: HTMLElement;

    constructor(actor: Actor, navElement: HTMLElement) {
        this.actor = actor;
        this.navElement = navElement;
    }
}

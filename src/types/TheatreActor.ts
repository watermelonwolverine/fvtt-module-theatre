export default class TheatreActor {

    actorData: ActorData;
    navElement: HTMLElement;

    constructor(actor: ActorData, navElement: HTMLElement) {
        this.actorData = actor;
        this.navElement = navElement;
    }
}

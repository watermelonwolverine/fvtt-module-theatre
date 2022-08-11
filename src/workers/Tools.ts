const THEATRE_PREFIX = "theatre-"

export default function getTheatreId(actor: Actor) {
    return THEATRE_PREFIX + actor.data._id;
}

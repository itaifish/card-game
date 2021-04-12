import NonSharedZone from "./NonSharedZone";
import Player from "../player/Player";
import CardInstance from "../card/CardInstance";

export default class Graveyard extends NonSharedZone {
    constructor(owner: Player, cards?: CardInstance[]) {
        super("Graveyard", true, true, owner, cards);
    }
}

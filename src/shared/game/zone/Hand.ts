import NonSharedZone from "./NonSharedZone";
import Player from "../player/Player";
import CardInstance from "../card/CardInstance";

export default class Hand extends NonSharedZone {
    constructor(owner: Player, cards?: CardInstance[]) {
        super(false, false, owner, cards);
    }
}

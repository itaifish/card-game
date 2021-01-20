import NonSharedZone from "./NonSharedZone";
import Player from "../player/Player";
import CardInstance from "../card/CardInstance";

export default class Battlefield extends NonSharedZone {
    constructor(owner: Player, cards?: CardInstance[]) {
        super(true, false, owner, cards);
    }
}

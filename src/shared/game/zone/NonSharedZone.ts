import Zone from "./Zone";
import CardInstance from "../card/CardInstance";
import Player from "../player/Player";

export default abstract class NonSharedZone extends Zone {
    private readonly owner: Player;

    protected constructor(isPublic: boolean, isOrdered: boolean, owner: Player, cards?: Zone | CardInstance[]) {
        super(isPublic, false, isOrdered, cards);
        this.owner = owner;
    }

    getOwner = (): Player => {
        return this.owner;
    };
}

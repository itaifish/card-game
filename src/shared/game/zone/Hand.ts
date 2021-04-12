import NonSharedZone from "./NonSharedZone";
import Player from "../player/Player";
import CardInstance from "../card/CardInstance";

export default class Hand extends NonSharedZone {
    constructor(owner: Player, cards?: CardInstance[]) {
        super("Hand", false, false, owner, cards);
    }

    addCards(cards: CardInstance[]): void {
        const currentHand = this.getCards();
        cards.forEach((newCard) => currentHand.push(newCard));
    }
}

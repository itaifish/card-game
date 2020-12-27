import NonSharedZone from "./NonSharedZone";
import Player from "../player/Player";
import CardInstance from "../card/CardInstance";
import MathUtility from "../../utility/math";

export default class Library extends NonSharedZone {
    constructor(owner: Player, cards: CardInstance[]) {
        super(false, true, owner, cards);
    }

    shuffle = (): void => {
        const cards = this.getCards();
        for (let i = 0; i < cards.length - 1; i++) {
            const cardToSwapIntoCurrentIdx = MathUtility.randomIntegerInclusive(i, cards.length - 1);
            //perform swap
            const tempCard = cards[i];
            cards[i] = cards[cardToSwapIntoCurrentIdx];
            cards[cardToSwapIntoCurrentIdx] = tempCard;
        }
    };
}

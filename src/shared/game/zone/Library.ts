import NonSharedZone from "./NonSharedZone";
import Player from "../player/Player";
import CardInstance from "../card/CardInstance";
import MathUtility from "../../utility/math";
import Hand from "./Hand";
import { GameEvent } from "../../utility/EventEmitter";

export default class Library extends NonSharedZone {
    constructor(owner: Player, cards: CardInstance[]) {
        super("Library", false, true, owner, cards);
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

    draw = (hand: Hand, amount = 1): void => {
        // TODO: Trigger draw replacement effects
        const cards = this.getCards();
        if (amount > this.getSize()) {
            amount = this.getSize();
            this.emit(GameEvent.DRAW_PAST_DECK);
        }
        const cardsToGoToHand = cards.splice(cards.length - amount);
        hand.addCards(cardsToGoToHand);
        this.emit(GameEvent.PLAYER_DRAW, this.getOwner(), amount);
    };
}

import CardInstance from "../card/CardInstance";
import EventEmitter from "../../utility/EventEmitter";

export default abstract class Zone extends EventEmitter {
    private isPublic: boolean;
    private isShared: boolean;
    private isOrdered: boolean;
    private readonly cards: CardInstance[];

    /**
     * Creates a new Zone. Currently passes the list of cards by reference
     * @param isPublic Whether the zone is public (can be seen by anyone) or private (can only be seen by owner)
     * @param isShared Whether the zone is shared between all players or owned by a specific player
     * @param isOrdered Whether the zone order matters
     * @param cards List of cards in the zone
     */
    protected constructor(isPublic: boolean, isShared: boolean, isOrdered: boolean, cards?: Zone | CardInstance[]) {
        super();
        this.isShared = isShared;
        this.isPublic = isPublic;
        this.isOrdered = isOrdered;
        if (cards) {
            if (cards instanceof Zone) {
                this.cards = cards.getCards();
            } else {
                this.cards = cards;
            }
        } else {
            this.cards = [];
        }
    }

    getCards = (): CardInstance[] => {
        return this.cards;
    };

    getSize = (): number => {
        return this.getCards().length;
    };
}

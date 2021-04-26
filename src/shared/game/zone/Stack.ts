import Zone from "./Zone";
import CardInstance, { Card } from "../card/CardInstance";

export default class Stack extends Zone {
    constructor() {
        super("Stack", false, true, true, []);
    }

    pop(): CardInstance | null {
        return this.getCards().pop();
    }

    push(card: CardInstance): void {
        this.getCards().push(card);
    }

    isEmpty(): boolean {
        return this.getSize() == 0;
    }

    peek(): CardInstance | null {
        const cards = this.getCards();
        if (cards.length == 0) {
            return null;
        }
        return cards[cards.length - 1];
    }
}

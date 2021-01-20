import Zone from "./Zone";
import CardInstance, { Card } from "../card/CardInstance";

export default class Stack extends Zone {
    constructor() {
        super(false, true, true, []);
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
}

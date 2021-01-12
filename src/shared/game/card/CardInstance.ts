import { Counter } from "./Counter";
import Player from "../player/Player";

export enum CardType {
    INSTANT,
    SORCERY,
    CREATURE,
    LAND,
    PLANESWALKER,
    ENCHANTMENT,
    ARTIFACT,
}

export interface CardState {
    counters: Counter[];
    types: CardType[];
    owner: Player;
    controller?: Player; //default the owner
    revealedTo?: Player[]; // default based on zone
}

export interface Card {
    name: string;
    manaCost: string;
    isToken?: boolean;
}

export const copyInstance = (cardToCopy: CardInstance, preserveState = false): CardInstance => {
    // Note that `[...array]` will preform a shallow copy of an array. `arr.slice()` would work as well
    const copiedState: CardState = {
        counters: preserveState ? [...cardToCopy.state.counters] : [],
        types: [...cardToCopy.state.types],
        owner: cardToCopy.state.owner,
    };
    if (preserveState && cardToCopy.state.revealedTo) {
        copiedState.revealedTo = [...cardToCopy.state.revealedTo];
    }
    return {
        state: copiedState,
        card: cardToCopy.card,
    };
};

export const copyPile = (pileToCopy: CardInstance[], preserveState = false): CardInstance[] => {
    return pileToCopy.map((cardInstance) => copyInstance(cardInstance, preserveState));
};

export default interface CardInstance {
    state: CardState;
    card: Card;
}

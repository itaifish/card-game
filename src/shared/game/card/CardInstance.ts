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
    hiddenFromOwner?: boolean; // default false
    revealedTo?: Player[]; // default based on zone
}

export interface Card {
    name: string;
    manaCost: string;
    isToken?: boolean;
}

export const copyInstance = (cardToCopy: CardInstance, preserveState = false): CardInstance => {
    const copiedState: CardState = {
        counters: preserveState ? [...cardToCopy.state.counters] : [],
        types: [...cardToCopy.state.types],
    };
    if (cardToCopy.state.hiddenFromOwner) {
        copiedState.hiddenFromOwner = cardToCopy.state.hiddenFromOwner;
    }
    if (cardToCopy.state.revealedTo) {
        copiedState.revealedTo = [...cardToCopy.state.revealedTo];
    }
    return {
        // Note that `[...array]` will preform a shallow copy of the array. `arr.slice()` would work as well
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

import { Counter } from "./Counter";

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
}

export interface Card {
    name: string;
    manaCost: string;
    isToken: boolean;
}

export const copyInstance = (cardToCopy: CardInstance, preserveState = false): CardInstance => {
    return {
        // Note that `[...array]` will preform a shallow copy of the array. `arr.slice()` would work as well
        state: {
            counters: preserveState ? [...cardToCopy.state.counters] : [],
            types: [...cardToCopy.state.types],
        },
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

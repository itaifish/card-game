import { Counter } from "./Counter";
import Player from "../player/Player";
import * as uuid4 from "uuid4";

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
    id: string;
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
        id: preserveState ? cardToCopy.state.id : uuid4(),
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

export const isPermanent = (cardInstance: CardInstance): boolean => {
    const types = cardInstance.state.types;
    return (
        types.includes(CardType.ARTIFACT) ||
        types.includes(CardType.CREATURE) ||
        types.includes(CardType.ENCHANTMENT) ||
        types.includes(CardType.LAND) ||
        types.includes(CardType.PLANESWALKER)
    );
};

export default interface CardInstance {
    state: CardState;
    card: Card;
}

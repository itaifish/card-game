import { Counter } from "./Counter";
import Player from "../player/Player";
import uuid4 from "uuid4";
import { AbilityKeyword } from "./AbilityKeywords";
import GameManager from "../manager/GameManager";
import ManaCost from "../mana/Mana";

export enum CardType {
    INSTANT,
    SORCERY,
    CREATURE,
    LAND,
    PLANESWALKER,
    ENCHANTMENT,
    ARTIFACT,
}

export interface CardStatus {
    damage?: number;
    counters?: Map<AbilityKeyword, number>;
    abilities?: AbilityKeyword[];
}

export interface CardState {
    counters: Counter[];
    types: CardType[];
    owner: Player;
    id: string;
    controller?: Player; //default the owner
    revealedTo?: Player[]; // default based on zone
    status?: CardStatus;
    power?: number; //card's actual power and toughness
    toughness?: number;
    targetIds?: string[];
}

export interface Cost {
    manaCost?: ManaCost;
    tap?: boolean;
}

export interface ActivatedAbility {
    cost: Cost;
    ability: (gameManager: GameManager, state: CardState) => void;
}

export interface Card {
    name: string;
    cost: ManaCost;
    isToken?: boolean;
    power?: number; // Power and toughness is text on card
    toughness?: number;
    ability: (gameManager: GameManager, state: CardState) => void; // function to happen when card resolves. Also sets eventEmitters for game manager. Function may do absolutely nothing
    activatedAbilities: ActivatedAbility[];
    defaultState: {
        power?: number;
        toughness?: number;
        types: CardType[];
    };
}

export const copyInstance = (cardToCopy: CardInstance, preserveState = false): CardInstance => {
    // Note that `[...array]` will preform a shallow copy of an array. `arr.slice()` would work as well
    const copiedState: CardState = {
        counters: preserveState ? [...cardToCopy.state.counters] : [],
        types: [...cardToCopy.state.types],
        owner: cardToCopy.state.owner,
        id: preserveState ? cardToCopy.state.id : uuid4(),
        status: preserveState
            ? {
                  damage: cardToCopy.state.status?.damage,
                  counters: cardToCopy.state.status.counters ? new Map(cardToCopy.state.status.counters) : null,
              }
            : null,
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

export const isCreature = (cardInstance: CardInstance): boolean => {
    return cardInstance.state.types.includes(CardType.CREATURE);
};

export default interface CardInstance {
    state: CardState;
    card: Card;
}

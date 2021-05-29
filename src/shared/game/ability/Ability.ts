import CardInstance, { ActivatedAbility, Card, CardState } from "../card/CardInstance";
import { addManaPools, emptyCost, generateManaPool } from "../mana/Mana";
import GameManager from "../manager/GameManager";
import CardImage from "../../../client/game/card/CardImage";
import { Callback } from "../../utility/EventEmitter";

export function addManaAbility(manaToAdd: string): ActivatedAbility {
    return {
        cost: {
            tap: true,
            manaCost: emptyCost,
        },
        ability: (gameManager: GameManager, state: CardState) => {
            const player = state.controller || state.owner;
            gameManager.setPlayerManaPool(player, addManaPools(player.getMana(), generateManaPool(manaToAdd)));
        },
    };
}

export default class Ability implements CardInstance {
    card: Card;
    state: CardState;
    abilityFunction: Callback;

    constructor(card: CardInstance, abilityFunction: Callback) {
        this.card = card.card;
        this.state = card.state;
        this.abilityFunction = abilityFunction;
    }
}

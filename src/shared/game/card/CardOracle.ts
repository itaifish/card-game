import CardInstance, { ActivatedAbility, Card, CardState, CardType } from "./CardInstance";
import MathUtility from "../../utility/math";
import log, { LOG_LEVEL } from "../../utility/logger";
import ManaCost, { addManaPools, generateManaCost, generateManaPool } from "../mana/Mana";
import GameManager from "../manager/GameManager";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const doesNothing = () => {};
const landState = {
    types: [CardType.LAND],
};
const freeManaCost: ManaCost = generateManaCost("0");

const addManaAbility = (manaToAdd: string): ActivatedAbility => {
    return {
        cost: {
            tap: true,
            manaCost: freeManaCost,
        },
        ability: (gameManager: GameManager, state: CardState) => {
            const player = state.controller;
            gameManager.setPlayerManaPool(player, addManaPools(player.getMana(), generateManaPool(manaToAdd)));
        },
    };
};

//Holds all cards, and the specific card instances for each game
export default class CardOracle {
    private readonly gameCards: Map<string, CardInstance> = new Map<string, CardInstance>();

    public addCard(card: CardInstance): void {
        this.gameCards.set(card.state.id, card);
    }

    public getCard(cardId: string) {
        return this.gameCards.get(cardId);
    }

    static cardList: { [cardName: string]: Card } = {
        Island: {
            name: "Island",
            cost: freeManaCost,
            ability: doesNothing,
            activatedAbilities: [addManaAbility("U")],
            defaultState: landState,
        },
        Forest: {
            name: "Forest",
            cost: freeManaCost,
            ability: doesNothing,
            activatedAbilities: [addManaAbility("G")],
            defaultState: landState,
        },
        Swamp: {
            name: "Swamp",
            cost: freeManaCost,
            ability: doesNothing,
            activatedAbilities: [addManaAbility("B")],
            defaultState: landState,
        },
        Plains: {
            name: "Plains",
            cost: freeManaCost,
            ability: doesNothing,
            activatedAbilities: [addManaAbility("W")],
            defaultState: landState,
        },
        Mountain: {
            name: "Mountain",
            cost: freeManaCost,
            ability: doesNothing,
            activatedAbilities: [addManaAbility("R")],
            defaultState: landState,
        },
        "Spencer's Favorite Card": {
            name: "Spencer's Favorite Card",
            cost: generateManaCost("WWW5"),
            ability: (gameManager, state) => {
                const caster = state.controller;
                gameManager.setPlayerLife(caster, caster.getLife() + 25);
            },
            activatedAbilities: [],
            defaultState: {
                types: [CardType.SORCERY],
            },
        },
        "Itai Has a Crush on a Girl": {
            name: "Itai Has a Crush on a Girl",
            cost: generateManaCost("U"),
            ability: (gameManager, state) => {
                const caster = state.controller;
                if (MathUtility.randomIntegerInclusive(1, 20) == 20) {
                    //TODO: Game winning
                    log("The player wins the game", CardOracle.constructor.name, LOG_LEVEL.INFO);
                }
                gameManager.playerDrawCard(caster);
            },
            activatedAbilities: [],
            defaultState: {
                types: [CardType.INSTANT],
            },
        },
    };
}

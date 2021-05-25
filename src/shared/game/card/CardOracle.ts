import CardInstance, { ActivatedAbility, Card, CardState, CardType } from "./CardInstance";
import MathUtility from "../../utility/math";
import log, { LOG_LEVEL } from "../../utility/Logger";
import ManaCost, { addManaPools, emptyCost, generateManaCost, generateManaPool } from "../mana/Mana";
import GameManager from "../manager/GameManager";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const doesNothing = () => {};
const landState = {
    types: [CardType.LAND],
};

const addManaAbility = (manaToAdd: string): ActivatedAbility => {
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
};

//Holds all cards, and the specific card instances for each game
export default class CardOracle {
    private readonly gameCards: Map<string, CardInstance> = new Map<string, CardInstance>();

    public addCard(card: CardInstance): void {
        this.gameCards.set(card.state.id, card);
    }

    public getCardInstance(cardId: string) {
        return this.gameCards.get(cardId);
    }

    public static getCard(cardName: string) {
        const card = CardOracle.cardList[cardName];
        if (card) {
            return card;
        }
        log(`Unable to find card for name ${cardName}`, this, LOG_LEVEL.WARN);
        return null;
    }
    /**
     * This function grabs the names of all the cards except for "Hidden" which is not a real card
     * @returns string[]
     */
    public static getAllCardNames(): string[] {
        return Object.keys(this.cardList).filter((name) => name != "Hidden");
    }

    private static readonly cardList: { [cardName: string]: Card } = {
        Hidden: {
            // This card represents another card for the client side that is hidden to the player. This way clients are not sent data that the user should not know
            name: "Hidden",
            cost: emptyCost,
            ability: doesNothing,
            activatedAbilities: [],
            defaultState: {
                types: [],
            },
        },
        Island: {
            name: "Island",
            cost: emptyCost,
            ability: doesNothing,
            activatedAbilities: [addManaAbility("U")],
            defaultState: landState,
        },
        Forest: {
            name: "Forest",
            cost: emptyCost,
            ability: doesNothing,
            activatedAbilities: [addManaAbility("G")],
            defaultState: landState,
        },
        Swamp: {
            name: "Swamp",
            cost: emptyCost,
            ability: doesNothing,
            activatedAbilities: [addManaAbility("B")],
            defaultState: landState,
        },
        Plains: {
            name: "Plains",
            cost: emptyCost,
            ability: doesNothing,
            activatedAbilities: [addManaAbility("W")],
            defaultState: landState,
        },
        Mountain: {
            name: "Mountain",
            cost: emptyCost,
            ability: doesNothing,
            activatedAbilities: [addManaAbility("R")],
            defaultState: landState,
        },
        "Spencer's Favorite Card": {
            name: "Spencer's Favorite Card",
            cost: generateManaCost("WWW5"),
            ability: (gameManager, state) => {
                const caster = state.controller || state.owner;
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

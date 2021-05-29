import { GameEvent } from "../../../../../shared/utility/EventEmitter";
import { emptyCost, generateManaCost } from "../../../../../shared/game/mana/Mana";
import log, { LOG_LEVEL } from "../../../../../shared/utility/Logger";
import MathUtility from "../../../../../shared/utility/math";
import CardInstance, { Card, CardType } from "../../CardInstance";
import CardOracle from "../../CardOracle";
import Ability, { addManaAbility } from "../../../ability/Ability";
import { Step } from "../../../phase/Phase";

const collegeBoysCardList: { [cardName: string]: Card } = {
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
    "East Chapel Hill High School": {
        name: "East Chapel Hill High School",
        cost: emptyCost,
        ability: (gameManager, state) => {
            const caster = state.controller;
            gameManager.loadCardsTriggeredAbility(
                state.id,
                GameEvent.PERMANENTS_ENTER_BATTLEFIELD,
                (cards: CardInstance[]) => {
                    const self = cards.find((card) => card.state.id == state.id);
                    if (self && gameManager.getPlayerZoneMap().get(caster.getId()).hand.getSize() > 3) {
                        self.state.tapped = true;
                        return true;
                    }
                    return false;
                },
            );
        },
        activatedAbilities: [addManaAbility("B"), addManaAbility("R")],
        defaultState: {
            types: [CardType.LAND],
            subTypes: ["Swamp", "Mountain"],
        },
    },
    "Planet Fitness": {
        name: "Planet Fitness",
        cost: emptyCost,
        ability: (gameManager, state) => {
            const caster = state.controller;
            gameManager.loadCardsTriggeredAbility(
                state.id,
                GameEvent.PERMANENTS_ENTER_BATTLEFIELD,
                (cards: CardInstance[]) => {
                    const self = cards.find((card) => card.state.id == state.id);
                    if (self && gameManager.getPlayerZoneMap().get(caster.getId()).hand.getSize() > 3) {
                        self.state.tapped = true;
                        return true;
                    }
                    return false;
                },
            );
        },
        activatedAbilities: [addManaAbility("W"), addManaAbility("R")],
        defaultState: {
            types: [CardType.LAND],
            subTypes: ["Plains", "Mountain"],
        },
    },
    "Burlington Park": {
        name: "Burlington Park",
        cost: emptyCost,
        ability: (gameManager, state) => {
            const caster = state.controller;
            gameManager.loadCardsTriggeredAbility(
                state.id,
                GameEvent.PERMANENTS_ENTER_BATTLEFIELD,
                (cards: CardInstance[]) => {
                    const self = cards.find((card) => card.state.id == state.id);
                    if (self && gameManager.getPlayerZoneMap().get(caster.getId()).hand.getSize() > 3) {
                        self.state.tapped = true;
                        return true;
                    }
                    return false;
                },
            );
        },
        activatedAbilities: [addManaAbility("W"), addManaAbility("G")],
        defaultState: {
            types: [CardType.LAND],
            subTypes: ["Plains", "Forest"],
        },
    },
    "Max's Hot Tub": {
        name: "Max's Hot Tub",
        cost: emptyCost,
        ability: (gameManager, state) => {
            const caster = state.controller;
            gameManager.loadCardsTriggeredAbility(
                state.id,
                GameEvent.PERMANENTS_ENTER_BATTLEFIELD,
                (cards: CardInstance[]) => {
                    const self = cards.find((card) => card.state.id == state.id);
                    if (self && gameManager.getPlayerZoneMap().get(caster.getId()).hand.getSize() > 3) {
                        self.state.tapped = true;
                        return true;
                    }
                    return false;
                },
            );
        },
        activatedAbilities: [addManaAbility("U"), addManaAbility("G")],
        defaultState: {
            types: [CardType.LAND],
            subTypes: ["Island", "Forest"],
        },
    },
    "Ridgewood Pool but it Rained": {
        name: "Ridgewood Pool but it Rained",
        cost: emptyCost,
        ability: (gameManager, state) => {
            const caster = state.controller;
            gameManager.loadCardsTriggeredAbility(
                state.id,
                GameEvent.PERMANENTS_ENTER_BATTLEFIELD,
                (cards: CardInstance[]) => {
                    const self = cards.find((card) => card.state.id == state.id);
                    if (self && gameManager.getPlayerZoneMap().get(caster.getId()).hand.getSize() > 3) {
                        self.state.tapped = true;
                        return true;
                    }
                    return false;
                },
            );
        },
        activatedAbilities: [addManaAbility("U"), addManaAbility("B")],
        defaultState: {
            types: [CardType.LAND],
            subTypes: ["Island", "Swamp"],
        },
    },
    "Bear with Upside": {
        name: "Bear with Upside",
        cost: generateManaCost("1G"),
        ability: (gameManager, state) => {
            const caster = state.controller;
            gameManager.loadCardsTriggeredAbility(state.id, GameEvent.BEGIN_STEP, (step: Step) => {
                if (step == Step.UPKEEP && gameManager.getPlayerWhoseTurnItIs().getId() == caster.getId()) {
                    const gainLifeAbility = () => {
                        gameManager.setPlayerLife(caster, caster.getLife() + 1);
                    };
                    gameManager.addAbilityToStack(new Ability(gameManager.getCardInstance(state.id), gainLifeAbility));
                }
                return false;
            });
        },
        activatedAbilities: [
            {
                cost: {
                    manaCost: emptyCost,
                    tap: true,
                },
                ability: (gameManager, state) => {
                    const caster = state.controller;
                    const gainLifeAbility = () => {
                        gameManager.setPlayerLife(caster, caster.getLife() + 1);
                    };
                    gameManager.addAbilityToStack(new Ability(gameManager.getCardInstance(state.id), gainLifeAbility));
                },
            },
        ],
        defaultState: {
            types: [CardType.CREATURE, CardType.LEGENDARY],
            subTypes: ["Bear"],
            power: 2,
            toughness: 2,
        },
    },
    "Bear with Downside": {
        name: "Bear with Downside",
        cost: generateManaCost("1G"),
        ability: (gameManager, state) => {
            const caster = state.controller;
            gameManager.loadCardsTriggeredAbility(state.id, GameEvent.BEGIN_STEP, (step: Step) => {
                if (step == Step.UPKEEP && gameManager.getPlayerWhoseTurnItIs().getId() == caster.getId()) {
                    const loseLifeAbility = () => {
                        gameManager.setPlayerLife(caster, caster.getLife() - 10);
                    };
                    gameManager.addAbilityToStack(new Ability(gameManager.getCardInstance(state.id), loseLifeAbility));
                }
                return false;
            });
        },
        activatedAbilities: [],
        defaultState: {
            types: [CardType.CREATURE],
            subTypes: ["Bear", "Meme"],
            power: 2,
            toughness: 2,
        },
    },
};

export default collegeBoysCardList;

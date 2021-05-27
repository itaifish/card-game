import { GameEvent } from "../../../../../shared/utility/EventEmitter";
import { emptyCost, generateManaCost } from "../../../../../shared/game/mana/Mana";
import log, { LOG_LEVEL } from "../../../../../shared/utility/Logger";
import MathUtility from "../../../../../shared/utility/math";
import CardInstance, { Card, CardType } from "../../CardInstance";
import CardOracle, { addManaAbility } from "../../CardOracle";

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
            const tapEvent = gameManager.on(GameEvent.PERMANENTS_ENTER_BATTLEFIELD, (cards: CardInstance[]) => {
                const self = cards.find((card) => card.state.id == state.id);
                if (self && gameManager.getPlayerZoneMap().get(caster.getId()).hand.getSize() > 3) {
                    self.state.tapped = true;
                }
                gameManager.clearEvent(tapEvent);
            });
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
            const tapEvent = gameManager.on(GameEvent.PERMANENTS_ENTER_BATTLEFIELD, (cards: CardInstance[]) => {
                const self = cards.find((card) => card.state.id == state.id);
                if (self && gameManager.getPlayerZoneMap().get(caster.getId()).hand.getSize() > 3) {
                    self.state.tapped = true;
                }
                gameManager.clearEvent(tapEvent);
            });
        },
        activatedAbilities: [addManaAbility("W"), addManaAbility("R")],
        defaultState: {
            types: [CardType.LAND],
            subTypes: ["Plains", "Mountain"],
        },
    },
};

export default collegeBoysCardList;

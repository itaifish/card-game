import { emptyCost, generateManaCost } from "../../../../../shared/game/mana/Mana";
import log, { LOG_LEVEL } from "../../../../../shared/utility/Logger";
import MathUtility from "../../../../../shared/utility/math";
import { Card, CardType } from "../../CardInstance";
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
        },
        activatedAbilities: [addManaAbility("B"), addManaAbility("R")],
        defaultState: {
            types: [CardType.LAND],
            subTypes: ["Swamp", "Mountain"],
        },
    },
};

export default collegeBoysCardList;

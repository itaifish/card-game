import { Card, CardType } from "./CardInstance";
import { Simulate } from "react-dom/test-utils";

// eslint-disable-next-line @typescript-eslint/no-empty-function

const doesNothing = () => {};
const landState = {
    types: [CardType.LAND],
};

export default class CardOracle {
    static cardList: { [cardName: string]: Card } = {
        Island: {
            name: "Island",
            manaCost: "0",
            ability: doesNothing,
            defaultState: landState,
        },
        Forest: {
            name: "Forest",
            manaCost: "0",
            ability: doesNothing,
            defaultState: landState,
        },
        Swamp: {
            name: "Swamp",
            manaCost: "0",
            ability: doesNothing,
            defaultState: landState,
        },
        Plains: {
            name: "Plains",
            manaCost: "0",
            ability: doesNothing,
            defaultState: landState,
        },
        Mountain: {
            name: "Mountain",
            manaCost: "0",
            ability: doesNothing,
            defaultState: landState,
        },
        "Spencer's Favorite Card": {
            name: "Spencer's Favorite Card",
            manaCost: "WWW5",
            ability: (gameManager, state) => {
                const castor = state.controller;
                gameManager.setPlayerLife(castor, castor.getLife() + 25);
            },
            defaultState: {
                types: [CardType.SORCERY],
            },
        },
    };
}

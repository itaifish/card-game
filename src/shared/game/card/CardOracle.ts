import { Card } from "./CardInstance";

export default class CardOracle {
    static cardList: { [cardName: string]: Card } = {
        Island: {
            name: "Island",
            manaCost: "0",
        },
        Forest: {
            name: "Forest",
            manaCost: "0",
        },
        Swamp: {
            name: "Swamp",
            manaCost: "0",
        },
        Plains: {
            name: "Plains",
            manaCost: "0",
        },
        Mountain: {
            name: "Mountain",
            manaCost: "0",
        },
    };
}

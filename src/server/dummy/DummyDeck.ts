import CardInstance, { Card, CardState } from "../../shared/game/card/CardInstance";

const dummyDeck: CardInstance[] = [];

for (let i = 0; i < 60; i++) {
    const dummyState: CardState = { id: "", owner: undefined, counters: [], types: [] };
    const dummyCard: Card = {
        name: "Island",
        manaCost: "0",
    };
    const basicIsland: CardInstance = {
        state: dummyState,
        card: dummyCard,
    };
    dummyDeck.push(basicIsland);
}

export default dummyDeck;

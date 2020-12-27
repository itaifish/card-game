import Library from "../../../../../src/shared/game/zone/Library";
import Player from "../../../../../src/shared/game/player/Player";
import CardInstance, { CardState, copyPile } from "../../../../../src/shared/game/card/CardInstance";
import CardOracle from "../../../../../src/shared/game/card/CardOracle";

describe("Library", () => {
    test("testShuffle", () => {
        const defaultState: CardState = { counters: [], types: [] };
        const cardNames = ["Island", "Swamp", "Forest", "Mountain", "Plains"];
        const cards: CardInstance[] = cardNames
            .map((cardName) => CardOracle.cardList[cardName])
            .map((card) => ({ card: card, state: defaultState }));
        const owner = new Player(0, cards);
        const library = new Library(owner, copyPile(cards));
        const unShuffledCards: number[] = new Array(cards.length).fill(0);
        const numTestRuns = 100;
        // There is a 1-in-x chance a card gets its own spot again. If a card appears in the same spot at
        // more than 3 times its expected chance, it is likely the shuffler has a problem
        const acceptableFailureRate = 3 * (1 / cards.length);
        for (let i = 0; i < numTestRuns; i++) {
            const oldLibrary = copyPile(library.getCards());
            library.shuffle();
            const newLibrary = library.getCards();
            newLibrary.forEach((newCard, index) => {
                if (newCard.card.name == oldLibrary[index].card.name) {
                    unShuffledCards[index]++;
                }
            });
        }
        unShuffledCards.forEach((amountOfUnshuffles: number, index: number) => {
            const failureRate = amountOfUnshuffles / numTestRuns;
            if (amountOfUnshuffles == 0 || failureRate > acceptableFailureRate) {
                fail(
                    `Card ${
                        cards[index].card.name
                    } ended up in the same spot as before ${amountOfUnshuffles} time(s). This is a failure rate of ${(
                        failureRate * 100
                    ).toPrecision(4)}%, which is not within the acceptable rate of ${(
                        acceptableFailureRate * 100
                    ).toPrecision(4)}%`,
                );
            } else {
                console.log(`Failure rate for ${cards[index].card.name}: ${(failureRate * 100).toPrecision(4)}%`);
            }
        });
    });
});

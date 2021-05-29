import Library from "../../../../../src/shared/game/zone/Library";
import Player from "../../../../../src/shared/game/player/Player";
import CardInstance, { CardState, copyPile } from "../../../../../src/shared/game/card/CardInstance";
import CardOracle from "../../../../../src/shared/game/card/CardOracle";
import Hand from "../../../../../src/shared/game/zone/Hand";
import { GameEvent } from "../../../../../src/shared/utility/EventEmitter";
import log from "../../../../../src/shared/utility/Logger";

describe("Library", () => {
    const defaultState: CardState = { id: "", owner: undefined, counters: [], types: [], subTypes: [], tapped: false };
    const cardNames = ["Island", "Swamp", "Forest", "Mountain", "Plains"];
    const cards: CardInstance[] = cardNames
        .map((cardName) => CardOracle.getCard(cardName))
        .map((card) => ({ card: card, state: defaultState }));
    const owner = new Player(0, 0, cards);
    const library = new Library(owner, copyPile(cards));
    test("testShuffle", () => {
        const unShuffledCards: number[] = new Array(cards.length).fill(0);
        const numTestRuns = 100;
        // There is a 1-in-x chance a card gets its own spot again. If a card appears in the same spot at
        // more than 2 times its expected chance, it is likely the shuffler has a problem
        const acceptableFailureRate = 2 * (1 / cards.length);
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
                log(`Failure rate for ${cards[index].card.name}: ${(failureRate * 100).toPrecision(4)}%`);
            }
        });
    });
    test("testDraw", () => {
        const hand = new Hand(owner);
        library.draw(hand);
        expect(hand.getSize()).toBe(1);
        expect(library.getSize()).toBe(cards.length - 1);
        let fail = true;
        library.on(GameEvent.DRAW_PAST_DECK, () => {
            fail = false;
        });
        library.draw(hand, library.getSize() + 1);
        expect(fail).toBe(false);
        expect(library.getSize()).toBe(0);
        expect(hand.getSize()).toBe(cards.length);
    });
});

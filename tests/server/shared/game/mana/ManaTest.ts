import { generateManaCost, stringifyManaCost } from "../../../../../src/shared/game/mana/Mana";

describe("ManaTest", () => {
    test("generateManaCostTest", () => {
        let manaCost = generateManaCost("WU4");
        expect(manaCost).toHaveProperty("White", 1);
        expect(manaCost).toHaveProperty("Blue", 1);
        expect(manaCost).toHaveProperty("Generic", 4);
        expect(manaCost).toHaveProperty("Green", 0);
        expect(manaCost).toHaveProperty("Red", 0);
        expect(manaCost).toHaveProperty("Black", 0);
        expect(manaCost).toHaveProperty("Colorless", 0);
        manaCost = generateManaCost("WWWWRRRU11");
        expect(manaCost).toHaveProperty("White", 4);
        expect(manaCost).toHaveProperty("Blue", 1);
        expect(manaCost).toHaveProperty("Generic", 11);
        expect(manaCost).toHaveProperty("Green", 0);
        expect(manaCost).toHaveProperty("Red", 3);
        expect(manaCost).toHaveProperty("Black", 0);
        expect(manaCost).toHaveProperty("Colorless", 0);
    });
    test("bidirectionalManaCost", () => {
        let manaCost = generateManaCost("WU4");
        let manaString = stringifyManaCost(manaCost);
        let newManaCost = generateManaCost(manaString);
        expect(newManaCost).toMatchObject(manaCost);
        manaCost = generateManaCost("WWWURRR");
        manaString = stringifyManaCost(manaCost);
        newManaCost = generateManaCost(manaString);
        expect(newManaCost).toMatchObject(manaCost);
    });
});

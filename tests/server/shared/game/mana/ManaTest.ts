import {
    generateManaCost,
    generateManaPool,
    isEmpty,
    stringifyManaCost,
    subtractCostFromManaPool,
} from "../../../../../src/shared/game/mana/Mana";
import { expect } from "@jest/globals";

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
        expect(newManaCost).toEqual(manaCost);
        manaCost = generateManaCost("WWWURRR");
        manaString = stringifyManaCost(manaCost);
        newManaCost = generateManaCost(manaString);
        expect(newManaCost).toEqual(manaCost);
    });
    test("subtractManaCosts", () => {
        let manaCost = generateManaCost("WU4");
        let manaPool = generateManaPool("WUGGCC");
        let result = subtractCostFromManaPool(manaPool, manaCost);
        expect(isEmpty(result)).toBe(true);
        manaPool = generateManaPool("RRRRRR");
        result = subtractCostFromManaPool(manaPool, manaCost);
        expect(result).toBeNull();
        manaCost = generateManaCost("W6");
        manaPool = generateManaPool("WWWWW");
        result = subtractCostFromManaPool(manaPool, manaCost);
        expect(result).toBeNull();
        manaCost = generateManaCost("W");
        result = subtractCostFromManaPool(manaPool, manaCost);
        expect(result).toHaveProperty("White", 4);
    });
});

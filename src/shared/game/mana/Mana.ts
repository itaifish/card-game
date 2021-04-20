import log, { LOG_LEVEL } from "../../utility/logger";

export type manaPoolTypes = "White" | "Blue" | "Red" | "Green" | "Black" | "Colorless";
export type manaCostTypes = manaPoolTypes | "Generic";

export default interface ManaCost {
    White: number;
    Blue: number;
    Red: number;
    Green: number;
    Black: number;
    Generic: number;
    Colorless: number;
}

export interface ManaPool {
    White: number;
    Blue: number;
    Red: number;
    Green: number;
    Black: number;
    Colorless: number;
}

export const addManaPools = (manaPool1: ManaPool, manaPool2: ManaPool): ManaPool => {
    const newManaPool: ManaPool = {
        White: 0,
        Blue: 0,
        Red: 0,
        Green: 0,
        Black: 0,
        Colorless: 0,
    };
    Object.keys(manaPool1).forEach((mana: manaPoolTypes) => {
        newManaPool[mana] = manaPool1[mana] + manaPool2[mana];
    });
    return newManaPool;
};

export const stringifyManaCost = (manaCost: ManaCost): string => {
    let returnString = "";
    Object.keys(manaCost).forEach((mana: manaCostTypes) => {
        if (mana != "Generic") {
            for (let i = 0; i < manaCost[mana]; i++) {
                returnString += mana === "Blue" ? "U" : mana.charAt(0);
            }
        }
    });
    // if generic manacost is more than 0 or the string isn't empty add the generic cost to the end
    if (manaCost.Generic > 0 || returnString.length === 0) {
        returnString += manaCost.Generic;
    }
    return returnString;
};

export const generateManaPool = (manaPoolString: string): ManaPool => {
    const manaPool: ManaPool = {
        White: 0,
        Blue: 0,
        Red: 0,
        Green: 0,
        Black: 0,
        Colorless: 0,
    };
    fillWithManaString(manaPool, manaPoolString);
    return manaPool;
};

export const generateManaCost = (manaCostString: string): ManaCost => {
    const manaCost: ManaCost = {
        White: 0,
        Black: 0,
        Blue: 0,
        Red: 0,
        Green: 0,
        Generic: 0,
        Colorless: 0,
    };
    const currentManaCostString = fillWithManaString(manaCost, manaCostString);
    if (!isNaN(+currentManaCostString)) {
        manaCost.Generic = +currentManaCostString;
    } else {
        log(
            `Unable to parse mana cost of ${manaCostString}, remaining with: ${currentManaCostString}`,
            "Mana",
            LOG_LEVEL.WARN,
        );
    }
    return manaCost;
};

const fillWithManaString = (mana: ManaPool | ManaCost, manaString: string): string => {
    const regexReplaces: [string, manaPoolTypes][] = [
        ["[wW]", "White"],
        ["[bB]", "Black"],
        ["[uU]", "Blue"],
        ["[rR]", "Red"],
        ["[gG]", "Green"],
        ["[cC]", "Colorless"],
    ];
    let currentManaCostString = manaString;
    regexReplaces.forEach((regexReplace) => {
        mana[regexReplace[1]] = currentManaCostString.match(new RegExp(regexReplace[0], "g"))?.length || 0;
        currentManaCostString = currentManaCostString.replace(new RegExp(regexReplace[0], "g"), "");
    });
    return currentManaCostString;
};

import log, { LOG_LEVEL } from "../../utility/Logger";

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

export const emptyCost: ManaCost = {
    White: 0,
    Blue: 0,
    Red: 0,
    Green: 0,
    Black: 0,
    Generic: 0,
    Colorless: 0,
};

export const emptyPool: ManaPool = {
    White: 0,
    Blue: 0,
    Red: 0,
    Green: 0,
    Black: 0,
    Colorless: 0,
};

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

export const isEmpty = (mana: ManaPool | ManaCost): boolean => {
    let empty =
        mana.Black == 0 && mana.Blue == 0 && mana.Colorless == 0 && mana.Red == 0 && mana.Green == 0 && mana.White == 0;
    if ("Generic" in mana) {
        empty = mana.Generic == 0 && empty;
    }
    return empty;
};
/**
 * @param pool: The mana pool to subtract the cost from
 * @param cost: The mana cost to subtract
 * @return returns the remaining mana in the mana pool, or null if the cost is higher than what is in the pool
 */
export const subtractCostFromManaPool = (pool: ManaPool, cost: ManaCost): ManaPool | null => {
    const newPool = { ...pool };
    // Pay color costs
    for (const color of Object.keys(pool)) {
        const manaColor: manaPoolTypes = color as manaPoolTypes;
        newPool[manaColor] -= cost[manaColor];
        if (newPool[manaColor] < 0) {
            log(
                `Cost requires ${cost[manaColor]} ${manaColor} but pool only has ${pool[manaColor]} ${manaColor}`,
                "Mana",
                LOG_LEVEL.WARN,
            );
            return null;
        }
    }
    // Pay generic costs
    let genericCost = cost.Generic;
    Object.keys(newPool).forEach((manaColor: manaPoolTypes) => {
        const colorAmount = newPool[manaColor];
        if (genericCost > colorAmount) {
            genericCost -= colorAmount;
            newPool[manaColor] = 0;
        } else {
            newPool[manaColor] -= genericCost;
            genericCost = 0;
        }
    });

    if (genericCost > 0) {
        log(`Cost requires ${cost.Generic} generic but pool does not have enough`, "Mana", LOG_LEVEL.WARN);
        return null;
    }
    return newPool;
};

export const stringifyMana = (manaCost: ManaCost | ManaPool | null): string => {
    if (manaCost == null) {
        return "null";
    }
    let returnString = "";
    Object.keys(manaCost).forEach((mana: manaCostTypes) => {
        if (mana != "Generic") {
            for (let i = 0; i < manaCost[mana]; i++) {
                returnString += mana === "Blue" ? "U" : mana.charAt(0);
            }
        }
    });
    // if generic manacost is more than 0 or the string isn't empty add the generic cost to the end
    const generic = "Generic" in manaCost ? manaCost.Generic : 0;
    if (generic > 0 || returnString.length === 0) {
        returnString += generic;
    }
    return returnString;
};

export const manaValueOf = (manaCost: ManaCost) => {
    return (
        manaCost.Generic +
        manaCost.Red +
        manaCost.Black +
        manaCost.Blue +
        manaCost.Green +
        manaCost.Colorless +
        manaCost.White
    );
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
    const remainingString = fillWithManaString(manaPool, manaPoolString);
    if (remainingString.length > 0) {
        log(
            `Unable to parse mana cost of ${manaPoolString}, remaining with: ${remainingString}`,
            "Mana",
            LOG_LEVEL.WARN,
        );
    }

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

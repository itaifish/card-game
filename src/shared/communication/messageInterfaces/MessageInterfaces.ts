import CardInstance, { Card, CardType } from "../../game/card/CardInstance";
import { ZoneName } from "../../game/zone/Zone";

export const isValid = (card: CardInstance, zone: ZoneName, criteria: SelectionCriteria): boolean => {
    const valid =
        criteria.canBeControlledBy.includes(card.state.controller.getId()) && criteria.legalZones.includes(zone);
    if (valid) {
        for (const type of criteria.legalTargets) {
            if (card.state.types.includes(type)) {
                return true;
            }
        }
    }
    return false;
};

export interface SelectionCriteria {
    legalTargets: CardType[];
    //TODO: Maybe update this to an enum somewhere?
    legalZones: string[];
    canBeControlledBy: number[]; // player ids who can control the card
}

// Server -> Client
export interface PleaseChooseTargetsMessage {
    targetsToChoose: SelectionCriteria[];
    cardId: string;
}

// Client -> Server
export interface PassedTargetsMessage {
    chosenTargets?: string[]; // card ids
    cardId: string;
}

import { Card, CardType } from "../../game/card/CardInstance";

export interface SelectionCriteria {
    legalTargets: CardType[];
    //TODO: Maybe update this to an enum somewhere?
    legalZones: string[];
}

// Server -> Client
export interface YouHavePriorityMessage {
    targetsToChoose?: SelectionCriteria[];
}

// Client -> Server
export interface PassedPriorityMessage {
    chosenTargets?: Card[];
}

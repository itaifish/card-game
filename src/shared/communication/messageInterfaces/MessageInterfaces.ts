import { CardType } from "../../game/card/CardInstance";

export interface SelectionCriteria {
    legalTargets: CardType[];
    //TODO: Maybe update this to an enum somewhere?
    legalZones: string[];
}

export interface YouHavePriorityMessage {
    targetsToChoose?: SelectionCriteria[];
}

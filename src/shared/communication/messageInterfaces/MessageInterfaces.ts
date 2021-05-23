import CardInstance, { Card, CardType } from "../../game/card/CardInstance";
import { ZoneName } from "../../game/zone/Zone";
import GameSettings from "../../game/settings/GameSettings";

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

export enum LoginMessageResponseType {
    SUCCESS,
    USER_NOT_EXIST,
    PASSWORD_INCORRECT,
}

export interface LoginMessageResponse {
    status: LoginMessageResponseType;
    userId: number;
}

export interface ClientUser {
    username: string;
    id: number;
}

export interface ClientLobby {
    settings: GameSettings;
    id: string;
    lobbyLeader: number;
    players: number[];
    playerTeamMap: {
        [teamId: number]: {
            [userId: number]: ClientUser;
        };
    };
}

export interface GetLobbiesResponse {
    lobbies: ClientLobby[];
}

// this represents a player putting a card on the stack, drawing a card, etc
export interface CardStateDelta {
    cardId: string;
    revealTo: "Self" | "Opponent" | "All" | "None";
    cardData?: CardInstance; // only provided if the card is revealed to the player
    oldZone: ZoneName;
    newZone: ZoneName;
}

// Client -> Server
export interface PassedTargetsMessage {
    chosenTargets?: string[]; // card ids
    cardId: string;
}

export interface LoginMessage {
    username: string;
    password: string;
}

export interface CreateLobbyRequest {
    settings: GameSettings;
}

export interface JoinLobbyRequest {
    lobbyId: string;
    teamId: number;
    deck: CardInstance[];
}

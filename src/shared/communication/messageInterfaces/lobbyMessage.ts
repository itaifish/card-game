import LobbySettings from "../../../server/room/lobby/lobbySettings";
import Lobby from "../../../server/room/lobby/Lobby";

export interface ClientUser {
    username: string;
    id: number;
}

export interface ClientLobby {
    settings: LobbySettings;
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
    lobbies: Lobby[];
}

export interface LobbyResponse {
    lobby: ClientLobby;
}

export interface CreateLobbyRequest {
    lobbySettings: LobbySettings;
}

export interface JoinLobbyRequest {
    lobbyId: string;
    teamId: number;
}

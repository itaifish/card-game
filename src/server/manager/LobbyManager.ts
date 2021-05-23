import uuid4 from "uuid4";
import Lobby from "../room/lobby/Lobby";
import Player from "../../shared/game/player/Player";
import GameSettings from "../../shared/game/settings/GameSettings";
import { User } from "./UserPlayerManager";
import { ClientLobby } from "../../shared/communication/messageInterfaces/MessageInterfaces";

export default class LobbyManger {
    //{ [lobbyId: string]: Lobby };
    private readonly lobbyMap: Map<string, Lobby>;
    //{ [userId: number]: Lobby };
    protected readonly usersToLobbyMap: Map<number, Lobby>;

    constructor() {
        this.lobbyMap = new Map<string, Lobby>();
        this.usersToLobbyMap = new Map<number, Lobby>();
    }

    getLobbyList(): ClientLobby[] {
        const lobbyList: ClientLobby[] = [];
        this.lobbyMap.forEach((lobby) => {
            lobbyList.push(lobby.asClientLobby());
        });
        return lobbyList;
    }

    userCreateLobby(user: User, settings: GameSettings, presetId?: string): Lobby {
        // disconnect user from any previous lobby they are in
        this.playerDisconnects(user);
        let id = presetId;
        if (!id) {
            do {
                id = uuid4();
            } while (this.lobbyMap.has(id)); // this should basically never happen, but just in case
        }
        const newLobby: Lobby = new Lobby(id, user, settings);
        this.usersToLobbyMap.set(user.id, newLobby);
        this.lobbyMap.set(id, newLobby);
        return newLobby;
    }

    userJoinTeamInLobby(user: User, lobbyId: string, teamId: number): Lobby {
        // disconnect user from any previous lobby they are in
        const lobby = this.lobbyMap.get(lobbyId);
        if (lobby) {
            const success = lobby.playerJoinTeam(user, teamId);
            if (success) {
                this.usersToLobbyMap.set(user.id, lobby);
                return lobby;
            } else if (lobby.getPlayers().length == 0) {
                this.deleteLobby(lobby.getId());
            }
        }
        return null;
    }

    playerDisconnects(user: User): void {
        const lobby = this.usersToLobbyMap.get(user.id);
        if (lobby) {
            lobby.playerLeaveLobby(user);
            if (lobby.getPlayers().length == 0) {
                this.deleteLobby(lobby.getId());
            }
        }
    }

    deleteLobby(lobbyId: string): void {
        if (this.lobbyMap.has(lobbyId)) {
            const lobbyToDel = this.lobbyMap.get(lobbyId);
            this.lobbyMap.delete(lobbyId);
            lobbyToDel.getPlayers().forEach((player) => {
                this.usersToLobbyMap.delete(player.id);
            });
        }
    }

    userToLobby(userId: number): Lobby {
        return this.usersToLobbyMap.get(userId);
    }
}

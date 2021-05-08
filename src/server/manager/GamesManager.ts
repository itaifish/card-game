import LobbyManger from "./LobbyManager";
import Lobby from "../room/lobby/Lobby";
import UserPlayerManager from "./UserPlayerManager";
import GameManager from "../../shared/game/manager/GameManager";
import log, { LOG_LEVEL } from "../../shared/utility/Logger";
import Server from "../Server";

export default class GamesManager extends LobbyManger {
    private readonly userManager: UserPlayerManager;

    private readonly server: Server;

    lobbyToGameManagerMap: Map<string, GameManager>;

    constructor(userManager: UserPlayerManager, server: Server) {
        super();
        this.userManager = userManager;
        this.server = server;
        this.lobbyToGameManagerMap = new Map<string, GameManager>();
    }

    lobbyToGame(lobby: Lobby): GameManager {
        const createdGame = this.userCreateLobby(lobby.getLobbyLeader(), lobby.getSettings(), lobby.getId());
        lobby.getPlayers().forEach((player) => {
            const teams = lobby.getPlayerTeamMap().keys();
            let currentPlayersTeam: number = null;
            for (const team of teams) {
                if (lobby.getPlayerTeamMap().get(team).has(player.id)) {
                    currentPlayersTeam = team;
                    break;
                }
            }
            this.userJoinTeamInLobby(player, createdGame.getId(), currentPlayersTeam);
        });
        this.lobbyToGameManagerMap.set(
            lobby.getId(),
            new GameManager(
                lobby.getId(),
                this.server,
                lobby.getPlayers().map((user) => user.player),
                lobby.getSettings(),
                lobby.getRoomName(),
            ),
        );
        return this.lobbyToGameManagerMap.get(lobby.getId());
    }

    playerToGameManager(userId: number): GameManager {
        const lobbyFromPlayer = this.usersToLobbyMap.get(userId);
        return this.lobbyToGameManagerMap.get(lobbyFromPlayer.getId());
    }
}

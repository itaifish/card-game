import Room from "../room";
import LobbySettings from "./lobbySettings";
import log, { LOG_LEVEL } from "../../../shared/utility/logger";
import Player from "../../../shared/game/player/Player";

export default class Lobby implements Room {
    private readonly settings: LobbySettings;
    private readonly id: string;
    private lobbyLeader: Player;
    private players: Player[];
    /*
    {
        [teamId: number]: {
            [userId: number]: User;
        };
    }
     */
    private readonly playerTeamMap: Map<number, Map<number, Player>>;

    constructor(id: string, initialPlayer: Player, settings: LobbySettings) {
        this.settings = settings;
        this.players = [];
        this.playerTeamMap = new Map<number, Map<number, Player>>();
        this.id = id;
        for (let i = 0; i < settings.numTeams; i++) {
            this.playerTeamMap.set(i, new Map<number, Player>());
        }
        this.playerJoinTeam(initialPlayer, 0);
        this.lobbyLeader = initialPlayer;
    }
    getRoomName(): string {
        return `${this.settings.lobbyName}: ${this.id}`;
    }

    /**
     * This function has a player join a lobby by joining one of the teams in the lobby
     * @param player User object for the player joining
     * @param teamId ID of the team to join
     * @returns whether or not the player was able to join
     */
    playerJoinTeam(player: Player, teamId: number): boolean {
        // Have player leave before rejoining to prevent the same player in more than one slot
        // Save the lobby leader since having a player leave a lobby for real resets the lobby leader
        let lobbyLeaderSave = null;
        if (this.lobbyLeader == player) {
            lobbyLeaderSave = this.lobbyLeader;
        }
        this.playerLeaveLobby(player);
        if (lobbyLeaderSave) {
            this.lobbyLeader = lobbyLeaderSave;
        }
        const team = this.playerTeamMap.get(teamId);
        if (team) {
            if (Object.keys(team).length < this.settings.maxPlayersPerTeam) {
                team.set(player.getId(), player);
                //player.status = UserStatus.IN_LOBBY;
                this.players.push(player);
                return true;
            }
        }
        return false;
    }
    /**
     * This function removes a player from the lobby
     * @param playerLeaving user who has left the lobby
     */
    playerLeaveLobby(playerLeaving: Player): void {
        // remove player leaving from list of players
        this.players = this.players.filter((player) => player.getId() != playerLeaving.getId());
        this.playerTeamMap.forEach((teamPlayers) => {
            if (teamPlayers.delete(playerLeaving.getId())) {
                //playerLeaving.status = UserStatus.ONLINE;
                if (this.lobbyLeader == playerLeaving) {
                    this.lobbyLeader = this.players[0] || null;
                }
                return;
            }
        });
    }

    getSettings(): LobbySettings {
        return this.settings;
    }

    getId(): string {
        return this.id;
    }

    getPlayers(): Player[] {
        return this.players;
    }

    getLobbyLeader(): Player {
        return this.lobbyLeader;
    }

    getPlayerTeamMap(): Map<number, Map<number, Player>> {
        return this.playerTeamMap;
    }

    // asClientLobby(): ClientLobby {
    //     return {
    //         settings: this.settings,
    //         id: this.id,
    //         lobbyLeader: this.lobbyLeader,
    //         players: this.players,
    //         playerTeamMap: playerTeamMap,
    //     };
    // }
}

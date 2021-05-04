import Room from "../room";
import Player from "../../../shared/game/player/Player";
import GameSettings from "../../../shared/game/settings/GameSettings";
import { ClientLobby, ClientUser } from "../../../shared/communication/messageInterfaces/MessageInterfaces";
import { User } from "../../manager/UserPlayerManager";

export default class Lobby implements Room {
    private readonly settings: GameSettings;
    private readonly id: string;
    private lobbyLeader: User;
    private players: User[];
    /*
    {
        [teamId: number]: {
            [userId: number]: User;
        };
    }
     */
    private readonly playerTeamMap: Map<number, Map<number, User>>;

    constructor(id: string, initialPlayer: User, settings: GameSettings) {
        this.settings = settings;
        this.players = [];
        this.playerTeamMap = new Map<number, Map<number, User>>();
        this.id = id;
        for (let i = 0; i < settings.numTeams; i++) {
            this.playerTeamMap.set(i, new Map<number, User>());
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
    playerJoinTeam(player: User, teamId: number): boolean {
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
            if (Object.keys(team).length < this.settings.playersPerTeam) {
                team.set(player.id, player);
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
    playerLeaveLobby(playerLeaving: User): void {
        // remove player leaving from list of players
        this.players = this.players.filter((player) => player.id != playerLeaving.id);
        this.playerTeamMap.forEach((teamPlayers) => {
            if (teamPlayers.delete(playerLeaving.id)) {
                //playerLeaving.status = UserStatus.ONLINE;
                if (this.lobbyLeader == playerLeaving) {
                    this.lobbyLeader = this.players[0] || null;
                }
                return;
            }
        });
    }

    getSettings(): GameSettings {
        return this.settings;
    }

    getId(): string {
        return this.id;
    }

    getPlayers(): User[] {
        return this.players;
    }

    getLobbyLeader(): User {
        return this.lobbyLeader;
    }

    getPlayerTeamMap(): Map<number, Map<number, User>> {
        return this.playerTeamMap;
    }

    asClientLobby(): ClientLobby {
        const playerTeamMap: {
            [teamId: number]: {
                [userId: number]: ClientUser;
            };
        } = {};
        Object.keys(this.playerTeamMap).forEach((teamId) => {
            const teamIdInt = parseInt(teamId);
            playerTeamMap[teamIdInt] = {};
            Object.keys(this.playerTeamMap.get(teamIdInt)).forEach((userId) => {
                const userIdInt = parseInt(userId);
                const user = this.playerTeamMap.get(teamIdInt).get(userIdInt);
                playerTeamMap[teamIdInt][userIdInt] = {
                    username: user.username,
                    id: user.id,
                };
            });
        });
        return {
            settings: this.settings,
            id: this.id,
            lobbyLeader: this.lobbyLeader.id,
            players: this.players.map((player) => player.id),
            playerTeamMap: playerTeamMap,
        };
    }
}

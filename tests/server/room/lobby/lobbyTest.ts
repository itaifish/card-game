import LobbyManger from "../../../../src/server/manager/LobbyManager";
import { User, UserStatus } from "../../../../src/server/manager/UserPlayerManager";
import Lobby from "../../../../src/server/room/lobby/Lobby";
import GameSettings from "../../../../src/shared/game/settings/GameSettings";

describe("lobby", () => {
    test("playerJoinTeam & playerLeaveLobby", () => {
        const settings: GameSettings = {
            numTeams: 2,
            numPlayers: 2,
            playersPerTeam: 1,
            bannedList: [],
            startingLife: 20,
            lobbyName: "testLobby",
        };
        const user1: User = {
            username: "test",
            password: "test",
            status: UserStatus.ONLINE,
            id: 0,
        };
        const user2: User = {
            username: "test",
            password: "test",
            status: UserStatus.ONLINE,
            id: 1,
        };
        const user3: User = {
            username: "test",
            password: "test",
            status: UserStatus.ONLINE,
            id: 2,
        };
        const manager: LobbyManger = new LobbyManger();
        const lobby: Lobby = manager.userCreateLobby(user1, settings);
        expect(JSON.stringify(lobby.getPlayerTeamMap())).toBe(
            JSON.stringify({
                "0": {
                    "0": user1,
                },
                "1": {},
            }),
        );
        expect(lobby.getLobbyLeader().id).toBe(0);
        expect(lobby.getPlayers().length).toBe(1);
        expect(user1.status).toBe(UserStatus.IN_LOBBY);
        manager.userJoinTeamInLobby(user2, lobby.getId(), 1);
        expect(JSON.stringify(lobby.getPlayerTeamMap())).toBe(
            JSON.stringify({
                "0": {
                    "0": user1,
                },
                "1": {
                    "1": user2,
                },
            }),
        );
        expect(lobby.getLobbyLeader().id).toBe(0);
        expect(lobby.getPlayers().length).toBe(2);
        manager.playerDisconnects(user1);
        expect(JSON.stringify(lobby.getPlayerTeamMap())).toBe(
            JSON.stringify({
                "0": {},
                "1": {
                    "1": user2,
                },
            }),
        );
        expect(user1.status).toBe(UserStatus.ONLINE);
        expect(lobby.getLobbyLeader().id).toBe(1);
        expect(lobby.getPlayers().length).toBe(1);
        manager.userJoinTeamInLobby(user1, lobby.getId(), 1);
        expect(JSON.stringify(lobby.getPlayerTeamMap())).toBe(
            JSON.stringify({
                "0": {},
                "1": {
                    "1": user2,
                    "0": user1,
                },
            }),
        );
        expect(user1.status).toBe(UserStatus.IN_LOBBY);
        expect(lobby.getLobbyLeader().id).toBe(1);
        expect(lobby.getPlayers().length).toBe(2);
        manager.userJoinTeamInLobby(user3, lobby.getId(), 1);
        // this should fail as team is full
        expect(JSON.stringify(lobby.getPlayerTeamMap())).toBe(
            JSON.stringify({
                "0": {},
                "1": {
                    "1": user2,
                    "0": user1,
                },
            }),
        );
        expect(user3.status).toBe(UserStatus.ONLINE);
        expect(lobby.getLobbyLeader().id).toBe(1);
        expect(lobby.getPlayers().length).toBe(2);
        // expect(JSON.stringify(manager.lobbyMap)).toBe(
        //     JSON.stringify({
        //         [lobby.getId()]: lobby,
        //     }),
        // );
        // expect(JSON.stringify(manager.usersToLobbyMap)).toBe(
        //     JSON.stringify({
        //         [user1.id]: lobby,
        //         [user2.id]: lobby,
        //     }),
        // );
    });
});

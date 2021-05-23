import express from "express";
import socketio from "socket.io";
import http from "http";
import Constants from "../shared/config/Constants";
import MessageEnum from "../shared/communication/messageEnum";
import UserPlayerManager from "./manager/UserPlayerManager";
import LobbyManger from "./manager/LobbyManager";
import log, { LOG_LEVEL } from "../shared/utility/Logger";
import GamesManager from "./manager/GamesManager";
import Player from "../shared/game/player/Player";
import {
    CardStateDelta,
    CreateLobbyRequest,
    GetLobbiesResponse,
    JoinLobbyRequest,
    LoginMessage,
    LoginMessageResponse,
    LoginMessageResponseType,
    PassedTargetsMessage,
    PleaseChooseTargetsMessage,
    SelectionCriteria,
} from "../shared/communication/messageInterfaces/MessageInterfaces";
import { GameEvent } from "../shared/utility/EventEmitter";
import GameManager from "../shared/game/manager/GameManager";
import CardOracle from "../shared/game/card/CardOracle";
import { instantiateCard } from "../shared/game/card/CardInstance";

export default class Server {
    // Server Variables
    app: express.Express;
    port: string | number;
    httpServer: http.Server;
    io: socketio.Server;
    //Managers
    userManager: UserPlayerManager;
    lobbyManager: LobbyManger;
    gamesManager: GamesManager;

    constructor() {
        this.app = express();
        this.port = process.env.PORT || Constants.DEFAULT_PORT;
        this.app.set("port", this.port);

        this.httpServer = new http.Server(this.app);
        this.io = new socketio(this.httpServer);

        this.userManager = new UserPlayerManager();
        this.lobbyManager = new LobbyManger();
        this.gamesManager = new GamesManager(this.userManager, this);
    }

    listen(): void {
        this.io.on("connection", (socket: socketio.Socket) => {
            log("Client connected", this, LOG_LEVEL.INFO);

            // Default behaviors
            socket.on(MessageEnum.DISCONNECT, (reason: string) => {
                log(`Client disconnected with reason ${reason}`, this, LOG_LEVEL.INFO);
                this.userManager.userDisconnected(socket.id);
            });
            socket.on(MessageEnum.ERROR, (error: unknown) => {
                log(`Error: ${JSON.stringify(error)}`, this, LOG_LEVEL.INFO);
            });
            socket.on(MessageEnum.LOGIN, (message: LoginMessage) => {
                const userResult = this.userManager.loginUser(message.username, message.password, socket);
                const status: LoginMessageResponseType = userResult
                    ? LoginMessageResponseType.SUCCESS
                    : userResult === null
                    ? LoginMessageResponseType.USER_NOT_EXIST
                    : LoginMessageResponseType.PASSWORD_INCORRECT;

                const responseMessage: LoginMessageResponse = {
                    status: status,
                    userId: typeof userResult == "boolean" ? null : userResult?.id,
                };
                socket.emit(MessageEnum.LOGIN, responseMessage);
            });
            socket.on(MessageEnum.GET_LOBBIES, () => {
                const response: GetLobbiesResponse = { lobbies: this.lobbyManager.getLobbyList() };
                socket.emit(MessageEnum.GET_LOBBIES, response);
            });
            socket.on(MessageEnum.CREATE_LOBBY, (lobbyRequest: CreateLobbyRequest) => {
                const user = this.userManager.getUserFromSocketId(socket.id);
                if (!user) {
                    return socket.emit(MessageEnum.LOGIN, { status: LoginMessageResponseType.USER_NOT_EXIST });
                }
                const createdLobby = this.lobbyManager.userCreateLobby(user, lobbyRequest.settings);
                log(`${user.username} has created lobby ${createdLobby.getId()}`, this, LOG_LEVEL.TRACE);
                // After creating a lobby respond with a list of all lobbies (Should have new lobby)
                const response: GetLobbiesResponse = { lobbies: this.lobbyManager.getLobbyList() };
                socket.join(createdLobby.getRoomName());
                socket.emit(MessageEnum.GET_LOBBIES, response);
            });
            socket.on(MessageEnum.JOIN_LOBBY, (joinLobbyRequest: JoinLobbyRequest) => {
                socket.leaveAll(); // leave all other rooms
                socket.join(socket.id); // join your own room
                const user = this.userManager.getUserFromSocketId(socket.id);
                log(
                    `Client ${user.username} attempting to join lobby: ${joinLobbyRequest.lobbyId} on team ${joinLobbyRequest.teamId}`,
                    this.constructor.name,
                    LOG_LEVEL.INFO,
                );
                const usersCurrentLobby = this.lobbyManager.userToLobby(user.id);
                if (usersCurrentLobby) {
                    // User already exist, remove them from room
                    socket.leave(usersCurrentLobby.getRoomName());
                }
                // disconnect player first
                this.lobbyManager.playerDisconnects(user);
                // set user's deck/set them as a player
                this.userManager.createPlayerFromUser(user, joinLobbyRequest.deck, joinLobbyRequest.teamId);
                const joinedLobby = this.lobbyManager.userJoinTeamInLobby(
                    user,
                    joinLobbyRequest.lobbyId,
                    joinLobbyRequest.teamId,
                );
                const response: GetLobbiesResponse = { lobbies: this.lobbyManager.getLobbyList() };
                // After joining a lobby respond with a list of all lobbies (Should have new lobby)
                if (joinedLobby) {
                    socket.join(joinedLobby.getRoomName()); // Join lobby name
                    socket.join(`${joinedLobby.getRoomName()}${joinLobbyRequest.teamId}`); //join specific team name also
                    this.io.to(joinedLobby.getRoomName()).emit(MessageEnum.GET_LOBBIES, response);
                } else {
                    socket.emit(MessageEnum.GET_LOBBIES, response);
                }
            });
        });

        this.httpServer.listen(this.port, () => {
            log(`listening on *:${Constants.DEFAULT_PORT}`, this, LOG_LEVEL.INFO);
        });
    }

    close(): void {
        this.io.close();
    }

    relayGameStateChange(changes: CardStateDelta[], sourcePlayer: Player): void {
        const gameManager: GameManager = this.gamesManager.playerToGameManager(sourcePlayer.getId());
        gameManager.getPlayers().forEach((player) => {
            const playerChanges: CardStateDelta[] = [];
            changes.forEach((change) => {
                const card = gameManager.getCardInstance(change.cardId);
                if (
                    change.revealTo === "All" ||
                    (player.getTeam() === sourcePlayer.getTeam() && change.revealTo === "Self") ||
                    (player.getTeam() !== sourcePlayer.getTeam() && change.revealTo === "Opponent")
                ) {
                    change.cardData = card;
                } else {
                    const hiddenCard = instantiateCard(
                        CardOracle.getCard("Hidden"),
                        change.cardId,
                        card.state.controller || card.state.owner,
                    );
                    change.cardData = hiddenCard;
                }
                playerChanges.push(change);
            });
            this.userManager
                .getUserFromUserId(sourcePlayer.getId())
                .socket.emit(MessageEnum.RELAY_GAMESTATE_CHANGE, playerChanges);
        });
    }

    playerHasPriority(player: Player) {
        const user = this.userManager.givePlayerPriority(player);
    }

    getTargetsFromPlayerForCard(cardId: string, playerId: number, targets: SelectionCriteria[]) {
        const user = this.userManager.getUserFromUserId(playerId);
        const game = this.gamesManager.playerToGameManager(playerId);
        if (user && game) {
            const message: PleaseChooseTargetsMessage = {
                targetsToChoose: targets,
                cardId: cardId,
            };
            user.socket.once(MessageEnum.CHOOSE_TARGETS, (responseMessage: PassedTargetsMessage) => {
                game.emit(GameEvent.PLAYER_CHOOSE_TARGETS, responseMessage.chosenTargets);
            });
            user.socket.emit(MessageEnum.CHOOSE_TARGETS, message);
        } else {
            log(
                `Unable to find user or game for player id: ${playerId}\nuser: ${user}\ngame:${game}`,
                this,
                LOG_LEVEL.WARN,
            );
        }
    }
}

export const runServer = () => {
    process.on("uncaughtException", function (err) {
        log(`Caught exception: ${err.message}`);
    });
    const server: Server = new Server();
    server.listen();
};

runServer();

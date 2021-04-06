import express from "express";
import socketio from "socket.io";
import http from "http";
import Constants from "../shared/config/constants";
import MessageEnum from "../shared/communication/messageEnum";
import {
    LoginMessageRequest,
    LoginMessageResponse,
    LoginMessageResponseType,
} from "../shared/communication/messageInterfaces/loginMessage";
import {
    CreateLobbyRequest,
    GetLobbiesResponse,
    JoinLobbyRequest,
} from "../shared/communication/messageInterfaces/lobbyMessage";
import UserPlayerManager from "./manager/UserPlayerManager";
import LobbyManger from "./manager/LobbyManager";
import log, { LOG_LEVEL } from "../shared/utility/logger";
import GamesManager from "./manager/GamesManager";
import { GameStateResponse } from "../shared/communication/messageInterfaces/endTurnMessage";

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
            log("Client connected", this.constructor.name, LOG_LEVEL.INFO);
            socket.on(MessageEnum.CREATE_ACCOUNT, (msg: LoginMessageRequest) => {
                const result = this.userManager.createUser(msg.username, msg.password);
                const status: LoginMessageResponseType = result
                    ? LoginMessageResponseType.SUCCESS
                    : LoginMessageResponseType.USER_NOT_EXIST;
                log(
                    `User attempting to create account: ${result ? " Success " : " Failed "}`,
                    this.constructor.name,
                    LOG_LEVEL.DEBUG,
                );
                socket.emit(MessageEnum.CREATE_ACCOUNT, { status: status });
            });
            socket.on(MessageEnum.LOGIN, (msg: LoginMessageRequest) => {
                const userResult = this.userManager.loginUser(msg.username, msg.password, socket);
                const status: LoginMessageResponseType = userResult
                    ? LoginMessageResponseType.SUCCESS
                    : userResult === null
                    ? LoginMessageResponseType.USER_NOT_EXIST
                    : LoginMessageResponseType.PASSWORD_INCORRECT;
                const responseMessage: LoginMessageResponse = {
                    status: status,
                };
                if (userResult) {
                    responseMessage.id = userResult.id;
                    const usersGame = this.gamesManager.playerToGameManager(userResult.id);
                    // rejoin left game
                    if (usersGame) {
                        // socket.join(usersLobby.getRoomName());
                        // responseMessage.gameStateToRejoin = {
                        //     gameState: usersGame.boardState,
                        //     gameId: usersGame.gameId,
                        // };
                        // // reset moves so player is seeing same thing as server
                        // usersGame.resetPlayerMoves(userResult.id);
                    }
                }
                socket.emit(MessageEnum.LOGIN, responseMessage);
            });
            // Lobbies
            socket.on(MessageEnum.GET_LOBBIES, () => {
                const response: GetLobbiesResponse = { lobbies: this.lobbyManager.getLobbyList() };
                socket.emit(MessageEnum.GET_LOBBIES, response);
            });
            socket.on(MessageEnum.CREATE_LOBBY, (lobbyRequest: CreateLobbyRequest) => {
                const user = this.userManager.getUserFromSocketId(socket.id);
                if (!user) {
                    return socket.emit(MessageEnum.LOGIN, { status: LoginMessageResponseType.USER_NOT_EXIST });
                }
                // const createdLobby = this.lobbyManager.userCreateLobby(player, lobbyRequest.lobbySettings);
                // log(`${user.username} has created lobby ${createdLobby.id}`, this.constructor.name, LOG_LEVEL.INFO);
                // // After creating a lobby respond with a list of all lobbies (Should have new lobby)
                // const response: GetLobbiesResponse = { lobbies: this.lobbyManager.getLobbyList() };
                // socket.join(createdLobby.getRoomName());
                // socket.emit(MessageEnum.GET_LOBBIES, response);
            });
            socket.on(MessageEnum.JOIN_LOBBY, (joinLobbyRequest: JoinLobbyRequest) => {});
            socket.on(MessageEnum.START_GAME, () => {});
            // Default behaviors
            socket.on(MessageEnum.DISCONNECT, (reason: string) => {
                log(`Client disconnected with reason ${reason}`, this.constructor.name, LOG_LEVEL.INFO);
                this.userManager.userDisconnected(socket.id);
            });
            socket.on(MessageEnum.ERROR, (error: unknown) => {
                log(`Error: ${JSON.stringify(error)}`, this.constructor.name, LOG_LEVEL.INFO);
            });
        });

        this.httpServer.listen(this.port, () => {
            log(`listening on *:${Constants.DEFAULT_PORT}`, this.constructor.name, LOG_LEVEL.INFO);
        });
    }
}

const runServer = () => {
    process.on("uncaughtException", function (err) {
        log(`Caught exception: ${err.message}`);
    });
    const server: Server = new Server();
    server.listen();
};

runServer();

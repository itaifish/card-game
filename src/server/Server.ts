import express from "express";
import socketio from "socket.io";
import http from "http";
import Constants from "../shared/config/Constants";
import MessageEnum from "../shared/communication/messageEnum";
import UserPlayerManager from "./manager/UserPlayerManager";
import LobbyManger from "./manager/LobbyManager";
import log, { LOG_LEVEL } from "../shared/utility/logger";
import GamesManager from "./manager/GamesManager";
import Player from "../shared/game/player/Player";
import {
    PassedTargetsMessage,
    PleaseChooseTargetsMessage,
    SelectionCriteria,
} from "../shared/communication/messageInterfaces/MessageInterfaces";
import { GameEvent } from "../shared/utility/EventEmitter";

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

    close(): void {
        this.io.close();
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
                this.constructor.name,
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

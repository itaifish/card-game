import socketio from "socket.io-client";
import MessageEnum from "../shared/communication/messageEnum";
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
    ClientLobby,
} from "../shared/communication/messageInterfaces/MessageInterfaces";
import log, { LOG_LEVEL } from "../shared/utility/Logger";
import Process from "../../process.json";
import Constants from "../shared/config/Constants";
import GameSettings from "../shared/game/settings/GameSettings";
import CardInstance, { Card } from "../shared/game/card/CardInstance";

type callbackFunction = (...args: any[]) => void;

export default class Client {
    loginStatus: LoginMessageResponseType | null;

    gameOverWinner: string;

    lobbyList: ClientLobby[];

    socket: SocketIOClient.Socket;

    /**
     * {
        [key in MessageEnum]: callbackFunction[];
    };
     */
    messageCallbacks: Map<MessageEnum, callbackFunction[]>;

    userId: number;

    //stats: ServerStatsMessage;

    updateBoardStateCallback: () => void;

    constructor() {
        this.loginStatus = null;
        this.gameOverWinner = null;
        //this.stats = null;
        this.lobbyList = [];
        this.userId = null;
        const url = Process?.PROD ? Constants.HOSTED_URL : Constants.URL;
        this.socket = socketio(url);
        this.messageCallbacks = new Map<MessageEnum, callbackFunction[]>();
        for (const message of Object.values(MessageEnum)) {
            this.messageCallbacks.set(message, []);
        }
        this.updateBoardStateCallback = () => {
            log("This function should absolutely never be called", this, LOG_LEVEL.WARN);
        };
    }

    listen(): void {
        this.socket.on(MessageEnum.CONNECT, () => {
            log(`Socket has connected (${this.socket.connected})`, this, LOG_LEVEL.INFO);
            this.runAndRemoveCallbacks(MessageEnum.CONNECT);
        });
        this.socket.on(MessageEnum.DISCONNECT, () => {
            this.loginStatus = null;
            log(`Socket has disconnected (${this.socket.connected})`, this, LOG_LEVEL.INFO);
            this.runAndRemoveCallbacks(MessageEnum.DISCONNECT);
        });
        this.socket.on(MessageEnum.LOGIN, (msg: LoginMessageResponse) => {
            log(`Your login status is now: ${LoginMessageResponseType[msg.status]}`, this, LOG_LEVEL.INFO);
            this.loginStatus = msg.status;
            this.userId = msg.userId;
            this.runAndRemoveCallbacks(MessageEnum.LOGIN);
        });
        this.socket.on(MessageEnum.CREATE_ACCOUNT, (msg: LoginMessageResponse) => {
            this.loginStatus = msg.status;
            this.runAndRemoveCallbacks(MessageEnum.CREATE_ACCOUNT);
        });
        this.socket.on(MessageEnum.GET_LOBBIES, (response: GetLobbiesResponse) => {
            log(`Got this response: ${JSON.stringify(response)}`, this, LOG_LEVEL.DEBUG);
            this.lobbyList = response.lobbies;
            log(`Got ${this.lobbyList.length} lobbies`, this, LOG_LEVEL.INFO);
            this.runAndRemoveCallbacks(MessageEnum.GET_LOBBIES);
        });
    }

    /** Server Communication **/

    createAccount(username: string, password: string, callbackFunc?: callbackFunction): void {
        const loginData: LoginMessage = {
            username: username,
            password: password,
        };
        if (callbackFunc) {
            this.addOnServerMessageCallback(MessageEnum.CREATE_ACCOUNT, callbackFunc);
        }
        this.socket.emit(MessageEnum.CREATE_ACCOUNT, loginData);
    }

    sendLoginAttempt(username: string, password: string): void {
        const loginData: LoginMessage = {
            username: username,
            password: password,
        };
        this.socket.emit(MessageEnum.LOGIN, loginData);
    }

    createLobby(settings: GameSettings) {
        const createLobbyRequest: CreateLobbyRequest = {
            settings: settings,
        };
        this.socket.emit(MessageEnum.CREATE_LOBBY, createLobbyRequest);
    }

    joinLobby(lobbyId: string, teamId: number, startingDeck: CardInstance[], callbackFunc?: callbackFunction) {
        if (callbackFunc) {
            this.addOnServerMessageCallback(MessageEnum.GET_LOBBIES, callbackFunc);
        }
        const joinLobbyRequest: JoinLobbyRequest = {
            lobbyId: lobbyId,
            teamId: teamId,
            deck: startingDeck,
        };
        this.socket.emit(MessageEnum.JOIN_LOBBY, joinLobbyRequest);
    }

    leaveLobby(lobbyId: string, callbackFunc?: callbackFunction) {
        if (callbackFunc) {
            this.addOnServerMessageCallback(MessageEnum.GET_LOBBIES, callbackFunc);
        }
        // join a non-existant team in lobby to leave
        const joinLobbyRequest: JoinLobbyRequest = {
            lobbyId: lobbyId,
            teamId: -1,
            deck: [],
        };
        this.socket.emit(MessageEnum.JOIN_LOBBY, joinLobbyRequest);
    }

    loadLobbyList(callbackFunc?: callbackFunction): void {
        if (callbackFunc) {
            this.addOnServerMessageCallback(MessageEnum.GET_LOBBIES, callbackFunc);
        }
        this.socket.emit(MessageEnum.GET_LOBBIES);
    }

    startGame(callbackFunc?: callbackFunction): void {
        if (callbackFunc) {
            this.addOnServerMessageCallback(MessageEnum.START_GAME, callbackFunc);
        }
        this.socket.emit(MessageEnum.START_GAME);
    }

    concede(): void {
        this.socket.emit(MessageEnum.CONCEDE);
    }

    /**************************/

    addOnServerMessageCallback(serverMessage: MessageEnum, callbackFunc: callbackFunction): void {
        this.messageCallbacks.get(serverMessage).push(callbackFunc);
    }

    private runAndRemoveCallbacks(serverMessage: MessageEnum): void {
        this.messageCallbacks.get(serverMessage).forEach((callback) => callback());
        this.messageCallbacks.set(serverMessage, []);
    }
}

import DatabaseReader from "../database/databaseReader";
import socketio from "socket.io";
import Player from "../../shared/game/player/Player";
import CardInstance from "../../shared/game/card/CardInstance";
import log, { LOG_LEVEL } from "../../shared/utility/logger";
import { SelectionCriteria } from "../../shared/communication/messageInterfaces/MessageInterfaces";
import MessageEnum from "../../shared/communication/messageEnum";

export interface User {
    username: string;
    password: string;
    status: UserStatus;
    id: number;
    socket?: socketio.Socket;
    player?: Player;
}

export enum UserStatus {
    OFFLINE,
    ONLINE,
    IN_LOBBY,
    IN_GAME,
}

export default class UserPlayerManager {
    userTokenMap: Map<string, User>;

    userIdMap: Map<number, User>;

    usernamesMap: Map<string, User>;

    runningId: number;

    constructor() {
        this.userIdMap = new Map<number, User>();
        this.userTokenMap = new Map<string, User>();
        this.usernamesMap = new Map<string, User>();
        this.loadUsers();
    }

    /**
     * This function loads the users from the database
     */
    loadUsers(): void {
        const reader: DatabaseReader = new DatabaseReader();
        this.runningId = reader.getRunningId();
        reader.loadUsers().forEach((user) => {
            this.userIdMap.set(user.id, user);
            this.usernamesMap.set(user.username, user);
        });
    }

    /**
     * This function creates a user and returns true if successful, false if user is not unique
     * @param user The user to create
     */
    createUser(username: string, password: string): boolean {
        if (this.usernamesMap.has(username)) {
            return false;
        }
        this.runningId += 1;
        const user: User = {
            username: username,
            password: password,
            status: UserStatus.OFFLINE,
            id: this.runningId,
        };
        this.userIdMap.set(user.id, user);
        this.usernamesMap.set(user.username, user);
        return true;
    }

    /**
     * This function logs a user in, returning the user if successful, null if the user does not
     * exist, and false if the password is incorrect
     * @param username User's username
     * @param password User's password
     */
    loginUser(username: string, password: string, socket: socketio.Socket): User | false | null {
        const user: User = this.usernamesMap.get(username);
        if (user) {
            if (user.password === password) {
                if (user.status != UserStatus.OFFLINE) {
                    this.logoutUser(username);
                }
                user.socket = socket;
                user.status = UserStatus.ONLINE;
                this.userTokenMap.set(socket.id, user);
                return user;
            }
            return false;
        }
        return null;
    }
    /**
     * This function logs the user out, removing their userToken from the
     * map and setting their status to be offline
     * @param username Username of user to log out
     */
    logoutUser(username: string): boolean {
        const user = this.usernamesMap.get(username);
        if (user) {
            this.userTokenMap.delete(user.socket.id);
            user.status = UserStatus.OFFLINE;
            user.socket = null;
            return true;
        }
        return false;
    }

    getUserFromSocketId(socketId: string): User {
        return this.userTokenMap.get(socketId);
    }

    getUserFromUserId(userId: number): User {
        return this.userIdMap.get(userId);
    }

    /**
     * If a user disconnects without triggering logout functionality,
     * this function will try to look up the user by user token and then
     * log them out
     * @param token socket id to log user out
     */
    userDisconnected(token: string): boolean {
        const user = this.getUserFromSocketId(token);
        if (user) {
            return this.logoutUser(user.username);
        } else {
            return false;
        }
    }

    createPlayerFromUser(user: User | number, startingLibrary: CardInstance[]): User {
        const userId = typeof user == "number" ? user : user.id;
        const userObj = this.getUserFromUserId(userId);
        userObj.player = new Player(userId, startingLibrary);
        return userObj;
    }

    givePlayerPriority(player: Player) {
        const user: User = this.getUserFromUserId(player.getId());
        if (!user) {
            log(`${player.getId()} can not be found/associated with any user`, this, LOG_LEVEL.ERROR);
        } else {
            user.socket.emit(MessageEnum.PASSED_PRIORITY);
        }
    }
}

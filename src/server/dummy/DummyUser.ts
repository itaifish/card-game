import { User, UserStatus } from "../manager/UserPlayerManager";
import Player from "../../shared/game/player/Player";
import DummySocket from "./DummySocket";
import dummyDeck from "./DummyDeck";

export default class DummyUser implements User {
    id: number;
    password: string;
    player: Player;
    socket: DummySocket;
    status: UserStatus;
    username: string;

    constructor(id = -1) {
        this.id = id;
        this.password = "dummyPassword";
        this.username = "dummyUsername";
        this.player = new Player(this.id, dummyDeck);
        this.status = UserStatus.IN_GAME;
        this.socket = new DummySocket();
    }
}

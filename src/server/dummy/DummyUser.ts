import { User, UserStatus } from "../manager/UserPlayerManager";
import Player from "../../shared/game/player/Player";
import DummySocket from "./DummySocket";
import dummyDeck from "./DummyDeck";
import MessageEnum from "../../shared/communication/messageEnum";
import GameManager from "../../shared/game/manager/GameManager";
import {
    isValid,
    SelectionCriteria,
    YouHavePriorityMessage,
} from "../../shared/communication/messageInterfaces/MessageInterfaces";
import CardInstance from "../../shared/game/card/CardInstance";
import log, { LOG_LEVEL } from "../../shared/utility/logger";

export default class DummyUser implements User {
    id: number;
    password: string;
    player: Player;
    socket: DummySocket;
    status: UserStatus;
    username: string;

    constructor(id = -1, manager: GameManager) {
        this.id = id;
        this.password = "dummyPassword";
        this.username = "dummyUsername";
        this.player = new Player(this.id, dummyDeck);
        this.status = UserStatus.IN_GAME;
        this.socket = new DummySocket();
        // Whenever get passed priority, pass it right on back
        this.socket.on(MessageEnum.PASSED_PRIORITY, (message: YouHavePriorityMessage) => {
            const targets: string[] = [];
            message.targetsToChoose.forEach((critera: SelectionCriteria) => {
                let firstValidCard: CardInstance = null;
                const allCards = manager.getAllCardsOnBattlefield();
                for (const card of allCards) {
                    if (isValid(card, "Battlefield", critera)) {
                        firstValidCard = card;
                        break;
                    }
                }
                if (firstValidCard) {
                    targets.push(firstValidCard.state.id);
                } else {
                    log(
                        `Unable to find a valid card for the criteria: ${JSON.stringify(critera)}`,
                        this.constructor.name,
                        LOG_LEVEL.ERROR,
                    );
                    throw new Error("No Valid Cards to Target");
                }
            });
            manager.passPriority(this.player, targets);
        });
    }
}

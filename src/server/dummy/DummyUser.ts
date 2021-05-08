import { User, UserStatus } from "../manager/UserPlayerManager";
import Player from "../../shared/game/player/Player";
import DummySocket from "./DummySocket";
import MessageEnum from "../../shared/communication/messageEnum";
import GameManager from "../../shared/game/manager/GameManager";
import {
    isValid,
    SelectionCriteria,
    PleaseChooseTargetsMessage,
} from "../../shared/communication/messageInterfaces/MessageInterfaces";
import CardInstance from "../../shared/game/card/CardInstance";
import log, { LOG_LEVEL } from "../../shared/utility/Logger";

export default class DummyUser implements User {
    id: number;
    password: string;
    player: Player;
    socket: DummySocket;
    status: UserStatus;
    username: string;

    constructor(id = -1, manager: GameManager, player: Player) {
        this.id = id;
        this.password = "dummyPassword";
        this.username = "dummyUsername";
        this.player = player;
        this.status = UserStatus.IN_GAME;
        this.socket = new DummySocket();
        // Whenever get passed priority, pass it right on back
        this.socket.on(MessageEnum.CHOOSE_TARGETS, (message: PleaseChooseTargetsMessage) => {
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
                        this,
                        LOG_LEVEL.ERROR,
                    );
                    throw new Error("No Valid Cards to Target");
                }
            });
            manager.setCardTargets(message.cardId, targets);
        });
        this.socket.on(MessageEnum.PASSED_PRIORITY, () => {
            manager.passPriority(this.player.getId());
        });
    }
}

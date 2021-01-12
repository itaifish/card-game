import Graveyard from "../zone/Graveyard";
import Player from "../player/Player";
import Hand from "../zone/Hand";
import Library from "../zone/Library";
import Exile from "../zone/Exile";
import CardInstance, { copyPile } from "../card/CardInstance";
import EventEmitter, { GameEvent } from "../../utility/EventEmitter";
import Server from "../../../server/server";
import { nextStep, Step } from "../phase/Phase";
import log, { LOG_LEVEL } from "../../utility/logger";

interface PlayerZones {
    graveyard: Graveyard;
    hand: Hand;
    library: Library;
    exile: Exile;
}

interface GameResult {
    winners: Player[];
    losers: Player[];
    drawers: Player[];
}

export default class GameManager extends EventEmitter {
    private readonly playerZoneMap: Map<number, PlayerZones>;

    private readonly playerList: Player[];

    private readonly turnNumber: number;

    private playersTurnIndex: number;

    private gameStep: Step;

    private readonly gameId: string;

    private readonly result: GameResult;

    private priorityWaitingOn: Player[];

    constructor(gameId: string, server: Server, players: Player[]) {
        super();
        this.gameId = gameId;
        this.playerZoneMap = new Map<number, PlayerZones>();
        this.playerList = players;
        this.playersTurnIndex = 0;
        this.turnNumber = 0;
        this.result = null;
        this.gameStep = Step.UNTAP;
        this.priorityWaitingOn = [...this.playerList];
        players.forEach((player) => {
            const copiedLibrary: CardInstance[] = copyPile(player.getStartingLibrary());
            const newLibrary = new Library(player, copiedLibrary);
            newLibrary.on(GameEvent.DRAW_PAST_DECK, () => {
                // TODO: Player loses game
            });
            this.playerZoneMap.set(player.getId(), {
                graveyard: new Graveyard(player),
                hand: new Hand(player),
                library: newLibrary,
                exile: new Exile(player),
            });
        });
    }

    passPriority(player: Player) {
        if (player == null) {
            log("Player is null", this.constructor.name, LOG_LEVEL.WARN);
            return;
        }
        if (this.priorityWaitingOn[0] === player) {
            this.priorityWaitingOn.shift();
        } else {
            log(`Active player is not ${player.getId()}, but is instead ${this.priorityWaitingOn[0].getId()}`);
        }
        if (this.priorityWaitingOn.length == 0) {
            this.passStep();
        }
    }

    passStep() {
        this.priorityWaitingOn = [
            this.playerList[this.playersTurnIndex],
            ...this.playerList.slice(this.playersTurnIndex + 1),
            ...this.playerList.slice(0, this.playersTurnIndex),
        ];
        this.gameStep = nextStep(this.gameStep);
        if (this.gameStep == Step.UPKEEP) {
            this.passTurn();
        }
        this.emit(GameEvent.BEGIN_STEP, this.gameStep);
    }

    passTurn() {
        this.playersTurnIndex++;
        if (this.playersTurnIndex >= this.playerList.length) {
            this.playersTurnIndex = 0;
        }
    }
}

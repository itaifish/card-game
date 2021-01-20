import Graveyard from "../zone/Graveyard";
import Player from "../player/Player";
import Hand from "../zone/Hand";
import Library from "../zone/Library";
import Exile from "../zone/Exile";
import Stack from "../zone/Stack";
import CardInstance, { CardType, copyPile, isPermanent } from "../card/CardInstance";
import EventEmitter, { GameEvent } from "../../utility/EventEmitter";
import Server from "../../../server/server";
import { nextStep, Step } from "../phase/Phase";
import log, { LOG_LEVEL } from "../../utility/logger";
import Battlefield from "../zone/Battlefield";

interface PlayerZones {
    graveyard: Graveyard;
    hand: Hand;
    library: Library;
    exile: Exile;
    battlefield: Battlefield;
}

interface GameResult {
    winners: Player[];
    losers: Player[];
    drawers: Player[];
}

export default class GameManager extends EventEmitter {
    private readonly playerZoneMap: Map<number, PlayerZones>;

    private readonly stack: Stack;

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
        this.stack = new Stack();
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
                battlefield: new Battlefield(player),
            });
        });
    }

    /**
     * Pass priority and return the next player's priority
     * @param player Player whose priority is being passed
     * @return Player whoever's priority is next
     */
    passPriority(player: Player): Player | null {
        if (player == null) {
            log("Player is null", this.constructor.name, LOG_LEVEL.WARN);
            return;
        }
        if (this.priorityWaitingOn[0] === player) {
            this.priorityWaitingOn.shift();
        } else {
            log(
                `Active player is not ${player.getId()}, but is instead ${this.priorityWaitingOn[0].getId()}`,
                this.constructor.name,
                LOG_LEVEL.WARN,
            );
        }
        if (this.priorityWaitingOn.length == 0) {
            if (this.stack.isEmpty()) {
                this.passStep();
            } else {
                const stackInstance = this.stack.pop();
                this.resolveCard(stackInstance);
                this.resetPriorityQueue();
            }
        }
        return this.priorityWaitingOn[0];
    }

    passStep() {
        this.resetPriorityQueue();
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

    playCard(player: Player, cardId: string) {
        if (this.priorityWaitingOn[0] == player) {
            const hand = this.playerZoneMap.get(player.getId()).hand;
            const cardRemoved = hand.removeCard(cardId);
            if (cardRemoved) {
                // Lands do not use the stack
                if (cardRemoved.state.types.includes(CardType.LAND)) {
                    this.instantiatePermanent(cardRemoved, player);
                } else {
                    this.stack.push(cardRemoved);
                }
            } else {
                log(
                    `Player ${player.getId()} tried to play a card ${cardId} but that card is not in their hand`,
                    this.constructor.name,
                    LOG_LEVEL.WARN,
                );
            }
        } else {
            log(
                `Player ${player.getId()} tried to play a card when it wasn't their turn`,
                this.constructor.name,
                LOG_LEVEL.WARN,
            );
        }
    }

    private instantiatePermanent(card: CardInstance, controller?: Player): void {
        if (!isPermanent(card)) {
            log(
                `Card ${card} is not a permanent, should not be instantiated as such`,
                this.constructor.name,
                LOG_LEVEL.WARN,
            );
            return;
        }
        const permanentController = controller || card.state.controller || card.state.owner;
        this.playerZoneMap.get(permanentController.getId()).battlefield.addCard(card);
    }

    resolveCard(card: CardInstance) {
        if (isPermanent(card)) {
            this.instantiatePermanent(card);
        }
    }

    private resetPriorityQueue(): void {
        this.priorityWaitingOn = [
            this.playerList[this.playersTurnIndex],
            ...this.playerList.slice(this.playersTurnIndex + 1),
            ...this.playerList.slice(0, this.playersTurnIndex),
        ];
    }
}

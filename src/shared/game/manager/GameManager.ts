import Graveyard from "../zone/Graveyard";
import Player from "../player/Player";
import Hand from "../zone/Hand";
import Library from "../zone/Library";
import Exile from "../zone/Exile";
import Stack from "../zone/Stack";
import CardInstance, { CardType, copyPile, isCreature, isPermanent } from "../card/CardInstance";
import EventEmitter, { GameEvent } from "../../utility/EventEmitter";
import Server from "../../../server/server";
import { nextStep, Step } from "../phase/Phase";
import log, { LOG_LEVEL } from "../../utility/logger";
import Battlefield from "../zone/Battlefield";
import GameSettings from "../settings/GameSettings";
import { AbilityKeyword } from "../card/AbilityKeywords";

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

    private turnNumber: number;

    private playersTurnIndex: number;

    private gameStep: Step;

    private readonly gameId: string;

    private readonly result: GameResult;

    private priorityWaitingOn: Player[];

    constructor(gameId: string, server: Server, players: Player[], settings: GameSettings) {
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
            player.setLife(settings.startingLife);
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
        log(`Active player is now ${this.priorityWaitingOn[0].getId()}`, this.constructor.name, LOG_LEVEL.TRACE);
        return this.priorityWaitingOn[0];
    }

    passStep() {
        this.resetPriorityQueue();
        log(`Passing Step ${this.gameStep} into ${nextStep(this.gameStep)}`, this.constructor.name, LOG_LEVEL.TRACE);
        this.gameStep = nextStep(this.gameStep);
        if (this.gameStep == Step.UPKEEP) {
            this.passTurn();
        }
        this.emit(GameEvent.BEGIN_STEP, this.gameStep);
    }

    passTurn() {
        const activePlayer = this.playerList[this.playersTurnIndex];
        log(
            `Passing Turn ${this.turnNumber} for player ${activePlayer.getId()}`,
            this.constructor.name,
            LOG_LEVEL.TRACE,
        );
        activePlayer.resetTurn();
        this.playersTurnIndex++;
        if (this.playersTurnIndex >= this.playerList.length) {
            this.playersTurnIndex = 0;
            this.turnNumber++;
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
                    player.playerPlayedLand();
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
        this.emit(GameEvent.PERMANENTS_ENTER_BATTLEFIELD, [card]);
        this.evaluateStateBasedActions();
    }

    resolveCard(card: CardInstance) {
        if (isPermanent(card)) {
            this.instantiatePermanent(card);
        } else {
        }
        this.evaluateStateBasedActions();
    }

    private resetPriorityQueue(): void {
        this.priorityWaitingOn = [
            this.playerList[this.playersTurnIndex],
            ...this.playerList.slice(this.playersTurnIndex + 1),
            ...this.playerList.slice(0, this.playersTurnIndex),
        ];
    }

    private evaluateStateBasedActions(): void {
        log("Evaluating State Based Actions...", this.constructor.name, LOG_LEVEL.TRACE);
        // Player loses the game
        const losers: Player[] = [];
        this.playerList.forEach((player) => {
            if (player.getLife() <= 0) {
                losers.push(player);
            }
        });
        // TODO: Finish this
        if (losers.length == this.playerList.length) {
            // Game ends in a draw
        } else {
            losers.forEach((loser) => {
                // Loser loses
            });
        }
        // Creatures die
        const creaturesToDie: CardInstance[] = [];
        this.playerZoneMap.forEach((zone) => {
            const battleField = zone.battlefield;
            battleField.getCards().forEach((card) => {
                if (isCreature(card)) {
                    const damage = card.state.status?.damage;
                    if (
                        damage &&
                        damage > card.state.toughness &&
                        !card.state.status.abilities.includes(AbilityKeyword.INDESTRUCTIBLE)
                    ) {
                        creaturesToDie.push(card);
                    }
                }
            });
        });
        this.creaturesDie(creaturesToDie);
    }

    creaturesDie(cards: CardInstance[]) {
        this.emit(GameEvent.PERMANENTS_LEAVE_BATTLEFIELD, cards, "Graveyard");
        cards.forEach((card) => {
            const owner = card.state.owner;
            const controller = card.state.controller;
            this.playerZoneMap.get(controller.getId()).battlefield.removeCard(card.state.id);
            this.playerZoneMap.get(owner.getId()).graveyard.addCard(card);
        });
        this.emit(GameEvent.CARDS_ENTER_GRAVEYARD, cards);
    }
}

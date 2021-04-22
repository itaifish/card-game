import Graveyard from "../zone/Graveyard";
import Player from "../player/Player";
import Hand from "../zone/Hand";
import Library from "../zone/Library";
import Exile from "../zone/Exile";
import Stack from "../zone/Stack";
import CardInstance, { CardType, copyPile, isCreature, isPermanent } from "../card/CardInstance";
import EventEmitter, { GameEvent } from "../../utility/EventEmitter";
import Server from "../../../server/Server";
import { nextStep, Step } from "../phase/Phase";
import log, { LOG_LEVEL } from "../../utility/logger";
import Battlefield from "../zone/Battlefield";
import GameSettings from "../settings/GameSettings";
import { AbilityKeyword } from "../card/AbilityKeywords";
import { SelectionCriteria } from "../../communication/messageInterfaces/MessageInterfaces";
import { ManaPool } from "../mana/Mana";
import CardOracle from "../card/CardOracle";

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

    private readonly playerMap: Map<number, Player>;

    private readonly stack: Stack;

    private readonly playerList: Player[];

    private readonly cardOracle: CardOracle;

    private turnNumber: number;

    private playersTurnIndex: number;

    private gameStep: Step;

    private readonly gameId: string;

    private readonly result: GameResult;

    private readonly server: Server;

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
        this.server = server;
        this.priorityWaitingOn = [...this.playerList];
        this.cardOracle = new CardOracle();
        players.forEach((player) => {
            const copiedLibrary: CardInstance[] = copyPile(player.getStartingLibrary());
            copiedLibrary.forEach((cardInstance) => {
                this.cardOracle.addCard(cardInstance);
            });
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
            this.playerMap.set(player.getId(), player);
            player.setLife(settings.startingLife);
        });
        this.on(GameEvent.BEGIN_STEP, (step: Step) => {
            if (step == Step.DRAW) {
                this.playerDrawCard(this.getPlayerWhoseTurnItIs());
            }
        });
    }

    getAllCardsOnBattlefield(): CardInstance[] {
        let cards: CardInstance[] = [];
        this.playerZoneMap.forEach((value, _key, _map) => {
            cards = [...cards, ...value.battlefield.getCards()];
        });
        return cards;
    }

    setCardTargets(cardId: string, targetIds: string[]) {
        const card = this.stack.getCard(cardId);
        if (card) {
            card.state.targetIds = targetIds;
            log(`Setting targets for card: ${cardId}: ${targetIds}`, this.constructor.name, LOG_LEVEL.TRACE);
        } else {
            log(`Unable to find ID ${cardId} on the stack`, this.constructor.name, LOG_LEVEL.WARN);
        }
    }

    /**
     * Pass priority and return the next player's priority
     * @param player Player whose priority is being passed
     * @return Player whoever's priority is next
     */
    passPriority(playerId: number): Player | null {
        if (playerId == null) {
            log("Player is null", this.constructor.name, LOG_LEVEL.WARN);
            return;
        }
        if (this.getActivePlayer().getId() === playerId) {
            this.priorityWaitingOn.shift();
        } else {
            log(
                `Active player is not ${playerId}, but is instead ${this.getActivePlayer().getId()}`,
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
        log(`Active player is now ${this.getActivePlayer().getId()}`, this.constructor.name, LOG_LEVEL.TRACE);
        return this.getActivePlayer();
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

    getTargetsFromPlayerForCard(cardId: string, playerId: number, targets: SelectionCriteria[]) {
        log(`Asking player: ${playerId} to choose targets: ${targets}`, this.constructor.name, LOG_LEVEL.TRACE);
        this.server.getTargetsFromPlayerForCard(cardId, playerId, targets);
        this.once(GameEvent.PLAYER_CHOOSE_TARGETS, (chosenCardIds: string[]) => {
            log(`Received targets: ${chosenCardIds} for card: ${cardId}`, this.constructor.name, LOG_LEVEL.TRACE);
            this.setCardTargets(cardId, chosenCardIds);
        });
    }

    passTurn() {
        const activePlayer = this.getPlayerWhoseTurnItIs();
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

    getPlayerWhoseTurnItIs(): Player {
        return this.playerList[this.playersTurnIndex];
    }

    getActivePlayer(): Player {
        return this.priorityWaitingOn[0];
    }

    playerDrawCard(player: Player, amount = 1) {
        const hand = this.playerZoneMap.get(player.getId()).hand;
        const library = this.playerZoneMap.get(player.getId()).library;
        library.draw(hand, amount);
    }

    setPlayerLife(player: Player, newLife: number) {
        this.emit(GameEvent.PLAYER_CHANGE_LIFE, player.getLife, newLife);
        player.setLife(newLife);
    }

    setPlayerManaPool(player: Player, newManaPool: ManaPool) {
        this.emit(GameEvent.PLAYER_NEW_MANA_POOL, player.getMana, newManaPool);
        player.setMana(newManaPool);
    }

    playCard(player: Player, cardId: string) {
        if (this.getActivePlayer().getId() == player.getId()) {
            const hand = this.playerZoneMap.get(player.getId()).hand;
            const cardRemoved = hand.removeCard(cardId);
            if (cardRemoved) {
                // Lands do not use the stack
                if (cardRemoved.state.types.includes(CardType.LAND)) {
                    this.instantiatePermanent(cardRemoved, player);
                    player.playerPlayedLand();
                    log(`Player ${player.getId()} played land: ${cardRemoved}`, this.constructor.name, LOG_LEVEL.TRACE);
                } else {
                    log(
                        `Player ${player.getId()} putting ${cardRemoved} on the stack`,
                        this.constructor.name,
                        LOG_LEVEL.TRACE,
                    );
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
        this.evaluateStateBasedActions();
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
            this.getPlayerWhoseTurnItIs(),
            ...this.playerList.slice(this.playersTurnIndex + 1),
            ...this.playerList.slice(0, this.playersTurnIndex),
        ];
    }

    /**
     * 704.5a If a player has 0 or less life, that player loses the game.
     704.5b If a player attempted to draw a card from a library with no cards in it since the last time state-based actions were checked, that player loses the game.
     704.5c If a player has ten or more poison counters, that player loses the game. Ignore this rule in Two-Headed Giant games; see rule 704.6b instead.
     704.5d If a token is in a zone other than the battlefield, it ceases to exist.
     704.5e If a copy of a spell is in a zone other than the stack, it ceases to exist. If a copy of a card is in any zone other than the stack or the battlefield, it ceases to exist.
     704.5f If a creature has toughness 0 or less, it’s put into its owner’s graveyard. Regeneration can’t replace this event.
     704.5g If a creature has toughness greater than 0, it has damage marked on it, and the total damage marked on it is greater than or equal to its toughness, that creature has been dealt lethal damage and is destroyed. Regeneration can replace this event.
     704.5h If a creature has toughness greater than 0, and it’s been dealt damage by a source with deathtouch since the last time state-based actions were checked, that creature is destroyed. Regeneration can replace this event.
     704.5i If a planeswalker has loyalty 0, it’s put into its owner’s graveyard.
     704.5j If a player controls two or more legendary permanents with the same name, that player chooses one of them, and the rest are put into their owners’ graveyards. This is called the “legend rule.”
     704.5k If two or more permanents have the supertype world, all except the one that has had the world supertype for the shortest amount of time are put into their owners’ graveyards. In the event of a tie for the shortest amount of time, all are put into their owners’ graveyards. This is called the “world rule.”
     704.5m If an Aura is attached to an illegal object or player, or is not attached to an object or player, that Aura is put into its owner’s graveyard.
     704.5n If an Equipment or Fortification is attached to an illegal permanent or to a player, it becomes unattached from that permanent or player. It remains on the battlefield.
     704.5p If a creature is attached to an object or player, it becomes unattached and remains on the battlefield. Similarly, if a permanent that’s neither an Aura, an Equipment, nor a Fortification is attached to an object or player, it becomes unattached and remains on the battlefield.
     704.5q If a permanent has both a +1/+1 counter and a -1/-1 counter on it, N +1/+1 and N -1/-1 counters are removed from it, where N is the smaller of the number of +1/+1 and -1/-1 counters on it.
     704.5r If a permanent with an ability that says it can’t have more than N counters of a certain kind on it has more than N counters of that kind on it, all but N of those counters are removed from it.
     704.5s If the number of lore counters on a Saga permanent is greater than or equal to its final chapter number and it isn’t the source of a chapter ability that has triggered but not yet left the stack, that Saga’s controller sacrifices it. See rule 714, “Saga Cards.”
     * @private
     */
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
                        (damage &&
                            damage > card.state.toughness &&
                            !card.state.status.abilities.includes(AbilityKeyword.INDESTRUCTIBLE)) ||
                        card.state.toughness <= 0
                    ) {
                        creaturesToDie.push(card);
                    }
                }
            });
        });
        this.creaturesDie(creaturesToDie);
    }
    // TODO: implement canBeRegenerated
    creaturesDie(cards: CardInstance[], canBeRegenerated = true) {
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

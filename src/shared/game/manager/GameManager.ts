import Graveyard from "../zone/Graveyard";
import Player from "../player/Player";
import Hand from "../zone/Hand";
import Library from "../zone/Library";
import Exile from "../zone/Exile";
import Stack from "../zone/Stack";
import CardInstance, {
    ActivatedAbility,
    CardType,
    copyPile,
    isCreature,
    isPermanent,
    simplifyCardForLogging,
} from "../card/CardInstance";
import EventEmitter, { Callback, GameEvent } from "../../utility/EventEmitter";
import Server from "../../../server/Server";
import { nextStep, Step, stepToPhase } from "../phase/Phase";
import log, { LOG_LEVEL } from "../../utility/logger";
import Battlefield from "../zone/Battlefield";
import GameSettings from "../settings/GameSettings";
import { AbilityKeyword } from "../card/AbilityKeywords";
import { SelectionCriteria } from "../../communication/messageInterfaces/MessageInterfaces";
import { emptyPool, isEmpty, ManaPool, stringifyMana, subtractCostFromManaPool } from "../mana/Mana";
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
                log(`Player ${player} has drawn past their deck`, this, LOG_LEVEL.INFO);
            });
            newLibrary.on(GameEvent.PLAYER_DRAW, () => {
                this.emit(GameEvent.PLAYER_DRAW, newLibrary);
            });
            this.playerZoneMap.set(player.getId(), {
                graveyard: new Graveyard(player),
                hand: new Hand(player),
                library: newLibrary,
                exile: new Exile(player),
                battlefield: new Battlefield(player),
            });
            newLibrary.shuffle();
            player.setLife(settings.startingLife);
            this.playerDrawCard(player, 7);
        });
        this.on(GameEvent.BEGIN_STEP, (step: Step) => {
            if (step == Step.DRAW) {
                this.playerDrawCard(this.getPlayerWhoseTurnItIs());
            } else if (step == Step.UNTAP) {
                // Untap cards in the untap step :)
                this.playerZoneMap
                    .get(this.getPlayerWhoseTurnItIs().getId())
                    .battlefield.getCards()
                    .forEach((card) => (card.state.tapped = false));
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
            log(`Setting targets for card: ${cardId}: ${targetIds}`, this, LOG_LEVEL.TRACE);
        } else {
            log(`Unable to find ID ${cardId} on the stack`, this, LOG_LEVEL.WARN);
        }
    }

    /**
     * Pass priority and return the next player's priority
     * @param player Player whose priority is being passed
     * @return Player whoever's priority is next
     */
    passPriority(playerId: number): Player | null {
        if (playerId == null) {
            log("Player is null", this, LOG_LEVEL.WARN);
            return;
        }
        if (this.getActivePlayer().getId() === playerId) {
            this.priorityWaitingOn.shift();
        } else {
            log(
                `Active player is not ${playerId}, but is instead ${this.getActivePlayer().getId()}`,
                this,
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
        log(`Active player is now ${this.getActivePlayer().getId()}`, this, LOG_LEVEL.TRACE);
        return this.getActivePlayer();
    }

    passStep() {
        this.resetPriorityQueue();
        log(`Passing Step ${Step[this.gameStep]} into ${Step[nextStep(this.gameStep)]}`, this, LOG_LEVEL.TRACE);
        const previousPhase = stepToPhase(this.gameStep);
        this.gameStep = nextStep(this.gameStep);
        const currentPhase = stepToPhase(this.gameStep);
        //if you pass phase, empty mana pool
        if (previousPhase != currentPhase) {
            this.playerList.forEach((player) => {
                this.setPlayerManaPool(player, emptyPool);
            });
        }
        if (this.gameStep == Step.UNTAP) {
            this.passTurn();
        }
        this.emit(GameEvent.BEGIN_STEP, this.gameStep);
    }

    getTargetsFromPlayerForCard(cardId: string, playerId: number, targets: SelectionCriteria[]) {
        log(`Asking player: ${playerId} to choose targets: ${targets}`, this, LOG_LEVEL.TRACE);
        this.server.getTargetsFromPlayerForCard(cardId, playerId, targets);
        this.once(GameEvent.PLAYER_CHOOSE_TARGETS, (chosenCardIds: string[]) => {
            log(`Received targets: ${chosenCardIds} for card: ${cardId}`, this, LOG_LEVEL.TRACE);
            this.setCardTargets(cardId, chosenCardIds);
        });
    }

    playerPayForCard(manaPaid: ManaPool, card: CardInstance) {
        const controller = card.state.controller || card.state.owner;
        this.payCostAndThen(manaPaid, card, () => {
            this.playCard(controller, card.state.id);
        });
    }

    /**
     * This function pays a cost and if the cost is successfully paid, calls the callback
     * @param manaPaid The {@link ManaPool} that paid for the cost
     * @param card The {@link CardInstance} that is being paid for OR the card whose {@link ActivatedAbility} is being paid for
     * @param callBack The callback function to call afterwards
     * @param abilityIndex An optional parameter if an ability is being paid for
     * @private
     */
    private payCostAndThen(manaPaid: ManaPool, card: CardInstance, callBack: Callback, abilityIndex?: number) {
        const cost = abilityIndex ? card.card.activatedAbilities[abilityIndex]?.cost.manaCost : card.card.cost;
        if (cost == null) {
            log(`Illegal ability index ${abilityIndex}`, this, LOG_LEVEL.ERROR);
            return;
        }
        const remaining = subtractCostFromManaPool(manaPaid, cost);
        const controller = card.state.controller || card.state.owner;
        const playerManaPool = controller.getMana();
        const playerManaCostDifference = subtractCostFromManaPool(playerManaPool, cost);
        if (playerManaCostDifference == null) {
            log(
                `Player ${controller.getId()} only has ${stringifyMana(playerManaPool)}, they can't pay ${stringifyMana(
                    manaPaid,
                )}`,
                this,
                LOG_LEVEL.WARN,
            );
            return;
        }
        this.setPlayerManaPool(controller, playerManaCostDifference);
        if (remaining && isEmpty(remaining)) {
            log(
                `Player ${controller.getId()} paying ${stringifyMana(cost)} with ${stringifyMana(manaPaid)} for card ${
                    card.card.name
                }`,
                this,
                LOG_LEVEL.TRACE,
            );
            if (abilityIndex) {
                if (card.card.activatedAbilities[abilityIndex].cost.tap) {
                    if (card.state.tapped) {
                        log(
                            `Unable to pay for ${card.card.name}'s ability ${abilityIndex} because it is tapped and the ability requires a tap as a cost`,
                            this,
                            LOG_LEVEL.ERROR,
                        );
                        return;
                    }
                    card.state.tapped = true;
                }
            }
            callBack();
        } else {
            log(
                `Player ${controller.getId()} failed to pay ${stringifyMana(cost)} with exactly ${stringifyMana(
                    manaPaid,
                )} for card ${card.card.name}: Remaining is: ${stringifyMana(remaining)}`,
                this,
                LOG_LEVEL.TRACE,
            );
        }
    }

    passTurn() {
        const activePlayer = this.getPlayerWhoseTurnItIs();
        log(`Passing Turn ${this.turnNumber} for player ${activePlayer.getId()}`, this, LOG_LEVEL.TRACE);
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

    activateCardAbility(card: CardInstance, abilityIndex: number, manaPaid: ManaPool) {
        const ability = card.card.activatedAbilities[abilityIndex];
        if (ability) {
            log(`Activating ${card.card.name} ability ${abilityIndex}`, this, LOG_LEVEL.TRACE);
            this.payCostAndThen(
                manaPaid,
                card,
                () => {
                    ability.ability(this, card.state);
                },
                abilityIndex,
            );
        } else {
            log(
                `Unable to Activate ${card.card.name} ability ${abilityIndex}, ${abilityIndex} is out of range ${card.card.activatedAbilities.length}`,
                this,
                LOG_LEVEL.WARN,
            );
        }
    }

    playerDrawCard(player: Player, amount = 1) {
        const hand = this.playerZoneMap.get(player.getId()).hand;
        const library = this.playerZoneMap.get(player.getId()).library;
        library.draw(hand, amount);
    }

    setPlayerLife(player: Player, newLife: number) {
        this.emit(GameEvent.PLAYER_CHANGE_LIFE, player.getLife, newLife);
        log(`Setting player ${player.getId()} life to ${newLife} from ${player.getLife()}`, this, LOG_LEVEL.TRACE);
        player.setLife(newLife);
    }

    setPlayerManaPool(player: Player, newManaPool: ManaPool) {
        this.emit(GameEvent.PLAYER_NEW_MANA_POOL, player.getMana, newManaPool);
        log(`Setting ${player.getId()}'s mana pool to ${stringifyMana(newManaPool)}`);
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
                    log(`Player ${player.getId()} played land: ${cardRemoved.card.name}`, this, LOG_LEVEL.TRACE);
                } else {
                    log(
                        `Player ${player.getId()} putting ${cardRemoved.card.name} on the stack`,
                        this,
                        LOG_LEVEL.TRACE,
                    );
                    this.stack.push(cardRemoved);
                }
            } else {
                log(
                    `Player ${player.getId()} tried to play a card ${cardId} but that card is not in their hand`,
                    this,
                    LOG_LEVEL.WARN,
                );
            }
        } else {
            log(`Player ${player.getId()} tried to play a card when it wasn't their turn`, this, LOG_LEVEL.WARN);
        }
        this.evaluateStateBasedActions();
    }

    private instantiatePermanent(card: CardInstance, controller?: Player): void {
        if (!isPermanent(card)) {
            log(`Card ${card} is not a permanent, should not be instantiated as such`, this, LOG_LEVEL.WARN);
            return;
        }
        const permanentController = controller || card.state.controller || card.state.owner;
        this.playerZoneMap.get(permanentController.getId()).battlefield.addCard(card);
        this.emit(GameEvent.PERMANENTS_ENTER_BATTLEFIELD, [card]);
        this.evaluateStateBasedActions();
    }

    resolveCard(card: CardInstance) {
        log(`Resolving card ${card.card.name}`, this, LOG_LEVEL.TRACE);
        if (isPermanent(card)) {
            this.instantiatePermanent(card);
        } else {
            card.card.ability(this, card.state);
            this.playerZoneMap.get(card.state.owner.getId()).graveyard.addCard(card);
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
        log("Evaluating State Based Actions...", this, LOG_LEVEL.TRACE);
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

    /**
     * Please don't  ask
     */
    stringifyGameState(): string {
        return JSON.stringify(
            this.playerList.map((player) => {
                const zones = this.playerZoneMap.get(player.getId());
                const zoneDataObj: { [zoneName: string]: any } = {};
                Object.keys(zones).forEach((zone: "graveyard" | "battlefield" | "exile" | "hand" | "library") => {
                    zoneDataObj[zone] = zones[zone]
                        .getCards()
                        .map((card: CardInstance) => simplifyCardForLogging(card));
                });
                return {
                    [player.getId()]: zoneDataObj,
                };
            }),
        );
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

    getStep(): Step {
        return this.gameStep;
    }

    getPlayerZoneMap(): Map<number, PlayerZones> {
        return this.playerZoneMap;
    }
}

import Server from "../../../../src/server/Server";
import GameManager from "../../../../src/shared/game/manager/GameManager";
import Player from "../../../../src/shared/game/player/Player";
import DummyUser from "../../../../src/server/dummy/DummyUser";
import CardInstance, { cardToString, CardType, instantiateCard } from "../../../../src/shared/game/card/CardInstance";
import CardOracle from "../../../../src/shared/game/card/CardOracle";
import uuid4 from "uuid4";
import GameSettings from "../../../../src/shared/game/settings/GameSettings";
import { GameEvent } from "../../../../src/shared/utility/EventEmitter";
import Library from "../../../../src/shared/game/zone/Library";
import log, { LOG_LEVEL } from "../../../../src/shared/utility/logger";
import { Step } from "../../../../src/shared/game/phase/Phase";
import { emptyPool, generateManaPool, manaValueOf } from "../../../../src/shared/game/mana/Mana";

describe("GameIntegrationTest", () => {
    test("gameMangerTest", () => {
        const server: Server = new Server();
        const cardNames = [
            "Plains",
            "Plains",
            "Plains",
            "Plains",
            "Plains",
            "Spencer's Favorite Card",
            "Plains",
            "Plains",
            "Plains",
            "Plains",
            "Plains",
            "Plains",
            "Plains",
            "Plains",
            "Plains",
            "Plains",
            "Plains",
        ];
        const playerIds = [1, 2];
        const players: Player[] = [];
        playerIds.forEach((playerId) => {
            const cards: CardInstance[] = cardNames
                .map((cardName) => CardOracle.getCard(cardName))
                .map((card) => instantiateCard(card, uuid4(), null));
            const player: Player = new Player(playerId, cards);
            cards.forEach((card) => {
                card.state.owner = player;
                card.state.controller = player;
            });
            players.push(player);
        });
        const settings: GameSettings = {
            numPlayers: 2,
            bannedList: [],
            startingLife: 20,
            numTeams: 2,
            lobbyName: "Lobby",
            playersPerTeam: 1,
        };
        const gameManager: GameManager = new GameManager("gameId", server, players, settings);
        const dummyUsers = playerIds.map((playerId) => {
            return new DummyUser(playerId, gameManager, players[playerId - 1]);
        });
        let numCardsDrawn = 0;
        gameManager.on(GameEvent.PLAYER_DRAW, (library: Library) => {
            numCardsDrawn++;
        });
        gameManager.on(GameEvent.PERMANENTS_ENTER_BATTLEFIELD, (cards: CardInstance[]) => {
            log(`Permanent(s) enter: ${JSON.stringify(cards.map((card) => card.card.name))}`);
        });
        const numTurns = cardNames.length * 2;
        const numPriorityPasses = numTurns * (Object.keys(Step).length / 2 + 1);
        for (let x = 0; x < numPriorityPasses; x++) {
            for (let i = 0; i < 2; i++) {
                const player = gameManager.getActivePlayer();
                const turnPlayer = gameManager.getPlayerWhoseTurnItIs();
                if (gameManager.getStep() == Step.MAIN_PHASE_1 && player.getId() == turnPlayer.getId()) {
                    const hand = gameManager.getPlayerZoneMap().get(turnPlayer.getId()).hand;
                    const battlefield = gameManager
                        .getAllCardsOnBattlefield()
                        .filter(
                            (card) =>
                                card.card.name == "Plains" &&
                                (card.state.controller?.getId() || card.state.owner.getId()) == player.getId() &&
                                !card.state.tapped,
                        );
                    for (const card of hand.getCards()) {
                        if (
                            card.card.name == "Spencer's Favorite Card" &&
                            battlefield.length >= manaValueOf(card.card.cost)
                        ) {
                            battlefield.forEach((card) => {
                                // tap the card
                                gameManager.activateCardAbility(card, 0, emptyPool);
                            });
                            gameManager.playerPayForCard(generateManaPool("WWWWWWWW"), card);
                            break;
                        } else if (card.state.types.includes(CardType.LAND)) {
                            //log(`Playing card: ${cardToString(card)}`);
                            gameManager.playerPayForCard(emptyPool, card);
                            break;
                        }
                    }
                }
                gameManager.passPriority(player.getId());
            }
        }
        log(`${numCardsDrawn} cards drawn`, "gameManagerTest");
        log(`Final Game State: ${gameManager.stringifyGameState()}`);
        server.close();
    });
});

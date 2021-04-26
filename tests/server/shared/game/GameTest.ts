import Server from "../../../../src/server/Server";
import GameManager from "../../../../src/shared/game/manager/GameManager";
import Player from "../../../../src/shared/game/player/Player";
import DummyUser from "../../../../src/server/dummy/DummyUser";
import CardInstance, { instantiateCard } from "../../../../src/shared/game/card/CardInstance";
import CardOracle from "../../../../src/shared/game/card/CardOracle";
import uuid4 from "uuid4";
import GameSettings from "../../../../src/shared/game/settings/GameSettings";
import { GameEvent } from "../../../../src/shared/utility/EventEmitter";
import Library from "../../../../src/shared/game/zone/Library";
import log from "../../../../src/shared/utility/logger";
import { Step } from "../../../../src/shared/game/phase/Phase";

describe("GameIntegrationTest", () => {
    test("gameMangerTest", () => {
        const server: Server = new Server();
        const cardNames = [
            "Island",
            "Swamp",
            "Forest",
            "Mountain",
            "Plains",
            "Spencer's Favorite Card",
            "Itai Has a Crush on a Girl",
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
        const numTurns = cardNames.length * 2;
        const numPriorityPasses = numTurns * (Object.keys(Step).length / 2 + 1);
        for (let x = 0; x < numPriorityPasses; x++) {
            for (const player of players) {
                gameManager.passPriority(player.getId());
            }
        }
        log(`${numCardsDrawn} cards drawn`, "gameManagerTest");
        server.close();
    });
    test("testDraw", () => {});
});

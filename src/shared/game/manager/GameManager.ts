import Graveyard from "../zone/Graveyard";
import Player from "../player/Player";
import Hand from "../zone/Hand";
import Library from "../zone/Library";
import Exile from "../zone/Exile";
import CardInstance, { copyPile } from "../card/CardInstance";
import { GameEvent } from "../../utility/EventEmitter";
import Server from "../../../server/server";

interface PlayerZones {
    graveyard: Graveyard;
    hand: Hand;
    library: Library;
    exile: Exile;
}

export default class GameManager {
    private readonly playerZoneMap: Map<number, PlayerZones>;

    private readonly playerList: Player[];

    private readonly gameId: string;

    constructor(gameId: string, server: Server, players: Player[]) {
        this.gameId = gameId;
        this.playerZoneMap = new Map<number, PlayerZones>();
        this.playerList = players;
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
}

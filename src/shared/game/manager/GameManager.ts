import Graveyard from "../zone/Graveyard";
import Player from "../player/Player";
import Hand from "../zone/Hand";
import Library from "../zone/Library";
import Exile from "../zone/Exile";
import CardInstance, { copyPile } from "../card/CardInstance";
import { GameEvent } from "../../utility/EventEmitter";

interface PlayerZones {
    graveyard: Graveyard;
    hand: Hand;
    library: Library;
    exile: Exile;
}

interface PlayerToZoneMap {
    [playerId: number]: PlayerZones;
}

export default class GameManager {
    private readonly playerZoneMap: PlayerToZoneMap;

    constructor(players: Player[]) {
        this.playerZoneMap = {};
        players.forEach((player) => {
            const copiedLibrary: CardInstance[] = copyPile(player.getStartingLibrary());
            const newLibrary = new Library(player, copiedLibrary);
            newLibrary.on(GameEvent.DRAW_PAST_DECK, () => {
                // TODO: Player loses game
            });
            this.playerZoneMap[player.getId()] = {
                graveyard: new Graveyard(player),
                hand: new Hand(player),
                library: newLibrary,
                exile: new Exile(player),
            };
        });
    }
}

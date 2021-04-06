import { Card } from "../card/CardInstance";

export default interface GameSettings {
    numPlayers: number;
    bannedList: Card[];
    startingLife: number;
    numTeams: number;
    lobbyName: string;
    playersPerTeam: number;
}

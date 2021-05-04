import CardInstance from "../card/CardInstance";
import { emptyPool, ManaPool } from "../mana/Mana";

export default class Player {
    private readonly id: number;
    private readonly startingLibrary: CardInstance[];
    private life: number;
    private mana: ManaPool;
    private readonly team: number;

    private landsPlayed: number;

    constructor(team: number, id: number, startingLibrary: CardInstance[]) {
        this.team = team;
        this.id = id;
        this.startingLibrary = startingLibrary;
        this.landsPlayed = 0;
        this.life = 0;
        this.mana = emptyPool;
    }

    getTeam = (): number => {
        return this.team;
    };

    getId = (): number => {
        return this.id;
    };

    getStartingLibrary = (): CardInstance[] => {
        return this.startingLibrary;
    };

    resetTurn() {
        this.landsPlayed = 0;
    }

    getLandsPlayed() {
        return this.landsPlayed;
    }

    playerPlayedLand() {
        this.landsPlayed++;
    }

    setLife(newLife: number) {
        this.life = newLife;
    }

    getLife(): number {
        return this.life;
    }

    getMana(): ManaPool {
        return this.mana;
    }

    setMana(newMana: ManaPool) {
        this.mana = newMana;
    }
}

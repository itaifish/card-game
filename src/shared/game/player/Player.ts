import CardInstance from "../card/CardInstance";

export default class Player {
    private readonly id: number;
    private readonly startingLibrary: CardInstance[];
    private life: number;

    private landsPlayed: number;

    constructor(id: number, startingLibrary: CardInstance[]) {
        this.id = id;
        this.startingLibrary = startingLibrary;
        this.landsPlayed = 0;
        this.life = 0;
    }

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
}

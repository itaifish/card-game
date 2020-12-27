import CardInstance from "../card/CardInstance";

export default class Player {
    private readonly id: number;
    private readonly startingLibrary: CardInstance[];

    constructor(id: number) {
        this.id = id;
    }

    getId = (): number => {
        return this.id;
    };

    getStartingLibrary = (): CardInstance[] => {
        return this.startingLibrary;
    };
}

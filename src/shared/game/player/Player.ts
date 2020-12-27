import CardInstance from "../card/CardInstance";

export default class Player {
    private readonly id: number;
    private readonly startingLibrary: CardInstance[];

    constructor(id: number, startingLibrary: CardInstance[]) {
        this.id = id;
        this.startingLibrary = startingLibrary;
    }

    getId = (): number => {
        return this.id;
    };

    getStartingLibrary = (): CardInstance[] => {
        return this.startingLibrary;
    };
}

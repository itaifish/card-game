import log, { LOG_LEVEL } from "./logger";
import uuid4 from "uuid4";

export enum GameEvent {
    PLAYER_DRAW,
    BEGIN_STEP,
    DRAW_PAST_DECK,
    LIFE_BELOW_ZERO,
    PERMANENTS_ENTER_BATTLEFIELD = 4,
    PERMANENTS_LEAVE_BATTLEFIELD,
    CARDS_ENTER_GRAVEYARD,
    PLAYER_CHOOSE_TARGETS,
    PLAYER_CHANGE_LIFE,
    PLAYER_NEW_MANA_POOL,
}

type Callback = (...args: any[]) => void;

export default abstract class EventEmitter {
    private readonly events: Map<GameEvent, Map<string, Callback>>;
    private readonly idToEvent: Map<string, GameEvent>;

    protected constructor() {
        this.events = new Map<GameEvent, Map<string, Callback>>();
        for (const event of Object.values(GameEvent)) {
            if (typeof event != "string") {
                this.events.set(event, new Map<string, Callback>());
            }
        }
        this.idToEvent = new Map<string, GameEvent>();
    }

    clearEvent(id: string): void {
        const event = this.idToEvent.get(id);
        if (!event) {
            log(`ID ${id} does not exist`, this.constructor.name, LOG_LEVEL.WARN);
            return;
        }
        this.events.get(event).delete(id);
        this.idToEvent.delete(id);
    }

    /**
     * This function adds an event listener for an emitted event and returns the listenerId which can be deleted via clearEvent
     * @param emittedEvent event to listen for
     * @param callback the function to call when the event is emitted
     */
    on(emittedEvent: GameEvent, callback: Callback): string {
        const id: string = uuid4();
        this.events.get(emittedEvent).set(id, callback);
        this.idToEvent.set(id, emittedEvent);
        return id;
    }

    /**
     * This adds an event listener for an emitted event that is only called the very next time the event triggers
     * @param emittedEvent event to listen for
     * @param callback the function to call when the event is emitted
     */
    once(emittedEvent: GameEvent, callback: Callback): void {
        const id = this.on(emittedEvent, () => {
            log("This function should never be called", this.constructor.name, LOG_LEVEL.ERROR);
        });
        this.events.get(emittedEvent).set(id, (...args) => {
            callback(...args);
            this.clearEvent(id);
        });
    }

    emit(event: GameEvent, ...args: any): void {
        this.events.get(event).forEach((callback) => {
            callback(...args);
        });
    }
}

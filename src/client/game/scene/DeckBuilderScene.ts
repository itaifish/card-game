import Phaser from "phaser";

import Client from "../../Client";
import CardOracle from "../../../shared/game/card/CardOracle";
import CardImage from "../card/CardImage";
import log from "../../../shared/utility/Logger";
import DragNDropPickZone from "../zone/DragNDropPickZone";

export default class DeckBuilderScene extends Phaser.Scene {
    instanceUpdatePool: Map<string, Phaser.GameObjects.GameObject>;

    constructor(client: Client) {
        const config: Phaser.Types.Scenes.SettingsConfig = {
            active: true,
        };
        super(config);
        this.instanceUpdatePool = new Map<string, Phaser.GameObjects.GameObject>();
    }

    preload() {
        CardOracle.getAllCardNames().forEach((cardName) => {
            this.load.image(cardName, `src/client/resources/images/${cardName}.jpg`);
        });
    }

    create() {
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            log("MOUSEDOWN");
        });
        CardOracle.getAllCardNames().forEach((cardName, index) => {
            const card = new CardImage(this, 50, 50, cardName);
            card.setX(card.displayWidth * (index + 1));
            card.setY(card.displayHeight / 2);
        });
        const pickFromZone = new DragNDropPickZone(this, 0, 0, this.game.canvas.width, 200);
    }

    update(time: number, delta: number) {
        super.update(time, delta);
        this.instanceUpdatePool.forEach((gameObject) => {
            gameObject.update();
        });
    }

    static getSceneName(): string {
        return this.constructor.name;
    }
}

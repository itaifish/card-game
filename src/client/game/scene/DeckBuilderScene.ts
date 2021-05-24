import Phaser from "phaser";

import Client from "../../Client";
import CardOracle from "../../../shared/game/card/CardOracle";
import CardImage from "../card/CardImage";
import log, { LOG_LEVEL } from "../../../shared/utility/Logger";
import DragNDropPickZone from "../zone/DragNDropPickZone";
import CardGame from "../CardGame";

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
        const pickFromZone = new DragNDropPickZone(this, 2, 2, this.game.canvas.width - 4, 200);
        this.input.on("dragstart", (pointer: Phaser.Input.Pointer, gameObject: CardImage) => {
            gameObject.setTint(0xff69b4);
        });

        this.input.on("dragend", (pointer: Phaser.Input.Pointer, gameObject: CardImage, dropped: boolean) => {
            gameObject.setTint();
        });
        this.input.on(
            "drop",
            (
                pointer: Phaser.Input.Pointer,
                gameObject: Phaser.GameObjects.GameObject,
                dropZone: Phaser.GameObjects.Zone,
            ) => {
                log(`dropping gameobject ${gameObject}`, this, LOG_LEVEL.DEBUG);
                if (gameObject instanceof CardImage) {
                    this.instanceUpdatePool.delete(gameObject.id);
                    gameObject.destroy();
                }
            },
        );
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

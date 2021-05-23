import Phaser from "phaser";

import Client from "../../Client";
import CardOracle from "../../../shared/game/card/CardOracle";
import CardImage from "../card/CardImage";
import log from "../../../shared/utility/Logger";

export default class DeckBuilderScene extends Phaser.Scene {
    constructor(client: Client) {
        const config: Phaser.Types.Scenes.SettingsConfig = {
            active: true,
        };
        super(config);
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
            card.setY(card.displayHeight);
        });
    }

    update(time: number, delta: number) {
        super.update(time, delta);
    }

    static getSceneName(): string {
        return this.constructor.name;
    }
}

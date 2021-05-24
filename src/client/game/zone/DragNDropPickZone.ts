import Phaser from "phaser";
import CardOracle from "../../../shared/game/card/CardOracle";
import DragNDropCard from "../card/DragNDropCard";
import DeckBuilderScene from "../scene/DeckBuilderScene";
import log, { LOG_LEVEL } from "../../../shared/utility/Logger";

export default class DragNDropPickZone extends Phaser.GameObjects.Zone {
    constructor(scene: DeckBuilderScene, x: number, y: number, width: number, height: number) {
        super(scene, x + width / 2, y + height / 2, width, height);
        const outlineGraphics = scene.add.graphics();
        this.setRectangleDropZone(width, height);
        outlineGraphics.lineStyle(4, 0xff69bf);
        outlineGraphics.strokeRect(
            this.x - this.input.hitArea.width / 2,
            this.y - this.input.hitArea.height / 2,
            this.input.hitArea.width,
            this.input.hitArea.height,
        );
        scene.add.existing(this);

        CardOracle.getAllCardNames().forEach((cardName, index) => {
            const card = new DragNDropCard(scene, 50, 50, cardName);
            card.setX(x + card.displayWidth * (index + 1));
            card.setY(y + this.input.hitArea.height / 2);
        });
    }
}

import Phaser from "phaser";
import CardOracle from "../../../shared/game/card/CardOracle";
import CardImage from "../card/CardImage";
import DragNDropCard from "../card/DragNDropCard";
import DeckBuilderScene from "../scene/DeckBuilderScene";

export default class DragNDropPickZone extends Phaser.GameObjects.Zone {
    constructor(scene: DeckBuilderScene, x: number, y: number, width: number, height: number) {
        super(scene, x, y, width, height);
        const outlineGraphics = scene.add.graphics();
        outlineGraphics.lineStyle(4, 0xff69bf);
        outlineGraphics.strokeRect(x, y, width, height);
        scene.add.existing(this);
        this.setRectangleDropZone(width, height);
        CardOracle.getAllCardNames().forEach((cardName, index) => {
            const card = new DragNDropCard(scene, 50, 50, cardName);
            card.setX(x + card.displayWidth * (index + 1));
            card.setY(y + card.displayHeight / 2);
        });
    }
}

import Phaser from "phaser";
import log, { LOG_LEVEL } from "../../../shared/utility/Logger";
import CardImage from "./CardImage";
import DeckBuilderScene from "../scene/DeckBuilderScene";

export default class DragNDropCard extends Phaser.GameObjects.Image {
    readonly cardName: string;

    constructor(scene: DeckBuilderScene, x: number, y: number, cardName: string) {
        super(scene, x, y, cardName);
        this.cardName = cardName;
        scene.add.existing(this);
        // TODO: Set these as constants
        this.setScale(134.4 / this.width, 187.2 / this.height);
        this.setInteractive();
        this.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            const newCard = new CardImage(scene, pointer.x, pointer.y, cardName);
            scene.instanceUpdatePool.set(newCard.id, newCard);
            newCard.followUntilClick();
        });
    }
}

import Phaser from "phaser";
import log, { LOG_LEVEL } from "../../../shared/utility/Logger";

export default class CardImage extends Phaser.GameObjects.Image {
    readonly cardName: string;

    constructor(scene: Phaser.Scene, x: number, y: number, cardName: string) {
        super(scene, x, y, cardName);
        this.cardName = cardName;
        scene.add.existing(this);
        // TODO: Set these as constants
        this.setDisplaySize(134.4, 187.2);
        this.setInteractive();
        scene.input.setDraggable(this);
        log(`Creating card: ${cardName}`, this, LOG_LEVEL.TRACE);
        this.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            this.setX(_pointer.x);
            this.setY(_pointer.y);
            log(`Dragging card to: ${dragX}, ${dragY}`, this, LOG_LEVEL.TRACE);
        });
    }
}

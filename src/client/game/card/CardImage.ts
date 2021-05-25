import Phaser from "phaser";
import log, { LOG_LEVEL } from "../../../shared/utility/Logger";
import { v4 as uuid4 } from "uuid";
import DeckBuilderScene from "../scene/DeckBuilderScene";
import Constants from "../../../shared/config/Constants";

export default class CardImage extends Phaser.GameObjects.Image {
    readonly cardName: string;

    private followPointer: boolean;

    readonly id: string;

    private readonly deckBuilderScene: DeckBuilderScene;

    constructor(scene: DeckBuilderScene, x: number, y: number, cardName: string) {
        super(scene, x, y, cardName);
        this.cardName = cardName;
        scene.add.existing(this);
        this.scene = scene;
        this.deckBuilderScene = scene;
        this.id = uuid4();
        this.followPointer = false;
        // TODO: Set these as constants
        this.setScale(Constants.CARD_SIZE.WIDTH / this.width, Constants.CARD_SIZE.HEIGHT / this.height);

        this.setInteractive();
        scene.input.setDraggable(this);
        log(`Creating card: ${cardName}`, this, LOG_LEVEL.TRACE);
        this.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            this.setX(dragX);
            this.setY(dragY);
            scene.children.bringToTop(this);
            log(`Dragging card to: ${dragX}, ${dragY}`, this, LOG_LEVEL.TRACE);
        });
    }

    followUntilClick() {
        this.followPointer = true;
        this.once("pointerup", () => {
            this.followPointer = false;
            this.deckBuilderScene.instanceUpdatePool.delete(this.id);
        });
    }

    update(...args: any) {
        super.update(...args);
        if (this.followPointer) {
            this.setX(this.scene.input.activePointer.x);
            this.setY(this.scene.input.activePointer.y);
        }
    }
}

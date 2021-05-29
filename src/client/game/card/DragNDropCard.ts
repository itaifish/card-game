import Phaser from "phaser";
import log, { LOG_LEVEL } from "../../../shared/utility/Logger";
import CardImage from "./CardImage";
import DeckBuilderScene from "../scene/DeckBuilderScene";
import DragNDropPickZone from "../zone/DragNDropPickZone";
import Constants from "../../../shared/config/Constants";
import MathUtility from "../../../shared/utility/math";

export default class DragNDropCard extends Phaser.GameObjects.Image {
    readonly cardName: string;

    constructor(scene: DeckBuilderScene, x: number, y: number, cardName: string, pickZone: DragNDropPickZone) {
        super(scene, x, y, cardName);
        this.cardName = cardName;
        scene.add.existing(this);
        // TODO: Set these as constants
        this.setScale(Constants.CARD_SIZE.WIDTH / this.width, Constants.CARD_SIZE.HEIGHT / this.height);
        this.setInteractive();
        this.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            const newCard = new CardImage(scene, pointer.x, pointer.y, cardName);
            scene.instanceUpdatePool.set(newCard.id, newCard);
            newCard.followUntilClick();
        });
        this.on(
            "wheel",
            (
                pointer: Phaser.Input.Pointer,
                deltaX: number,
                deltaY: number,
                deltaZ: number,
                event: Phaser.Types.Input.EventData,
            ) => {
                pickZone.emit("wheel", pointer, deltaX, deltaY, deltaZ, event);
            },
        );
    }
}

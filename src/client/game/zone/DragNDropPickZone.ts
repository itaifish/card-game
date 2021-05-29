import Phaser from "phaser";
import CardOracle from "../../../shared/game/card/CardOracle";
import DragNDropCard from "../card/DragNDropCard";
import DeckBuilderScene from "../scene/DeckBuilderScene";
import log, { LOG_LEVEL } from "../../../shared/utility/Logger";
import MathUtility from "../../../shared/utility/math";
import Constants from "../../../shared/config/Constants";

export default class DragNDropPickZone extends Phaser.GameObjects.Zone {
    cardNames: string[];

    private readonly camera: Phaser.Cameras.Scene2D.Camera;

    constructor(
        scene: DeckBuilderScene,
        x: number,
        y: number,
        width: number,
        height: number,
        camera: Phaser.Cameras.Scene2D.Camera,
    ) {
        super(scene, x + width / 2, y + height / 2, width, height);
        this.camera = camera;
        this.setRectangleDropZone(width, height);
        const outlineGraphics = scene.add.graphics();
        outlineGraphics.lineStyle(4, 0xff69bf);
        outlineGraphics.strokeRect(
            this.x - this.input.hitArea.width / 2,
            this.y - this.input.hitArea.height / 2,
            this.input.hitArea.width,
            this.input.hitArea.height,
        );
        scene.add.existing(this);

        this.cardNames = CardOracle.getAllCardNames();

        this.cardNames.forEach((cardName, index) => {
            const card = new DragNDropCard(scene, 50, 50, cardName, this);
            card.setX(x + card.displayWidth * (index + 1));
            card.setY(y + this.input.hitArea.height / 2);
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
                this.camera.scrollX += deltaY;
                this.camera.scrollX = MathUtility.clamp(
                    this.camera.scrollX,
                    (this.cardNames.length + 1.5) * Constants.CARD_SIZE.WIDTH - this.scene.game.canvas.width,
                    this.camera.x,
                );
                log(`scrollX:  ${this.camera.scrollX}\n x: ${this.camera.x}`, this, LOG_LEVEL.DEBUG);
            },
        );
    }
}

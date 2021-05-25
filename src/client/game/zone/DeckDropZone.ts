import Phaser from "phaser";
import DeckBuilderScene from "../scene/DeckBuilderScene";
import log, { LOG_LEVEL } from "../../../shared/utility/Logger";
import CardImage from "../card/CardImage";
import Constants from "../../../shared/config/Constants";

export default class DeckDropZone extends Phaser.GameObjects.Zone {
    private static readonly COLUMN_WIDTH: number = Constants.CARD_SIZE.WIDTH;

    private static readonly HEIGHT_OFFSET: number = Constants.CARD_SIZE.HEIGHT * 0.2;

    private static readonly OFFSET: number = DeckDropZone.COLUMN_WIDTH / 2;

    private readonly columns: Set<CardImage>[];

    constructor(scene: DeckBuilderScene, x: number, y: number, width: number, height: number) {
        super(scene, x + width / 2, y + height / 2, width, height);
        const outlineGraphics = scene.add.graphics();
        this.setRectangleDropZone(width, height);
        outlineGraphics.lineStyle(4, 0x11690f);
        outlineGraphics.strokeRect(
            this.x - this.input.hitArea.width / 2,
            this.y - this.input.hitArea.height / 2,
            this.input.hitArea.width,
            this.input.hitArea.height,
        );
        scene.add.existing(this);
        this.columns = [];
    }

    cardDrop(card: CardImage): void {
        for (const col of this.columns) {
            if (col.has(card)) {
                col.delete(card);
                break;
            }
        }
        const thisX = this.x - this.width / 2;
        const thisY = this.y - this.height / 2;
        let columnIndex = Math.round((card.x - DeckDropZone.OFFSET - thisX) / DeckDropZone.COLUMN_WIDTH);
        if (columnIndex >= this.columns.length) {
            this.columns.push(new Set());
            columnIndex = this.columns.length - 1;
        }
        console.log(columnIndex);
        this.columns[columnIndex].add(card);
        card.setX(thisX + DeckDropZone.OFFSET + DeckDropZone.COLUMN_WIDTH * columnIndex);
        card.setY(thisY + card.displayHeight / 2 + this.columns[columnIndex].size * DeckDropZone.HEIGHT_OFFSET);
    }
}

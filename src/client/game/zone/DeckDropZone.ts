import Phaser from "phaser";
import DeckBuilderScene from "../scene/DeckBuilderScene";
import log, { LOG_LEVEL } from "../../../shared/utility/Logger";
import CardImage from "../card/CardImage";
import Constants from "../../../shared/config/Constants";

export default class DeckDropZone extends Phaser.GameObjects.Zone {
    private static readonly COLUMN_WIDTH: number = Constants.CARD_SIZE.WIDTH;

    private static readonly HEIGHT_OFFSET: number = Constants.CARD_SIZE.HEIGHT * 0.15;

    private static readonly OFFSET: number = DeckDropZone.COLUMN_WIDTH / 2;

    private readonly columns: Set<CardImage>[];

    private readonly cardColumnMap: Map<CardImage, number>;

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
        this.cardColumnMap = new Map();
    }

    cardDrop(card: CardImage): void {
        this.removeCardFromColumns(card);
        const thisX = this.x - this.width / 2;
        let columnIndex = Math.round(
            (card.x - DeckDropZone.OFFSET - thisX - DeckDropZone.COLUMN_WIDTH / 3) / DeckDropZone.COLUMN_WIDTH,
        );
        if (columnIndex >= this.columns.length) {
            this.columns.push(new Set());
            columnIndex = this.columns.length - 1;
        }
        this.columns[columnIndex].add(card);
        this.cardColumnMap.set(card, columnIndex);
        this.positionCardInColumn(card, columnIndex, this.columns[columnIndex].size - 1);
    }

    positionCardInColumn(card: CardImage, columnIndex: number, index: number) {
        const thisX = this.x - this.width / 2;
        const thisY = this.y - this.height / 2;
        card.setX(
            thisX + DeckDropZone.OFFSET + DeckDropZone.COLUMN_WIDTH / 3 + DeckDropZone.COLUMN_WIDTH * columnIndex,
        );
        card.setY(thisY + card.displayHeight / 2 + (index + 1) * DeckDropZone.HEIGHT_OFFSET);
    }

    removeCardFromColumns(card: CardImage): void {
        if (this.cardColumnMap.has(card)) {
            const index = this.cardColumnMap.get(card);
            this.cardColumnMap.delete(card);
            this.columns[index].delete(card);
            let newIdx = 0;
            this.columns[index].forEach((card) => {
                this.positionCardInColumn(card, index, newIdx);
                newIdx++;
            });
        }
    }
}

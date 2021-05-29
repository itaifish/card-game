import Phaser from "phaser";
import DeckBuilderScene from "../scene/DeckBuilderScene";
import log, { LOG_LEVEL } from "../../../shared/utility/Logger";
import CardImage from "../card/CardImage";
import Constants from "../../../shared/config/Constants";
import MathUtility from "../../../shared/utility/math";

export default class DeckDropZone extends Phaser.GameObjects.Zone {
    private static readonly COLUMN_WIDTH: number = Constants.CARD_SIZE.WIDTH;

    private static readonly HEIGHT_OFFSET: number = Constants.CARD_SIZE.HEIGHT * 0.15;

    private static readonly OFFSET: number = DeckDropZone.COLUMN_WIDTH / 2;

    private static readonly MAX_CARDS_IN_COLUMN: number = 30;

    private static readonly MAX_COLUMNS = 8;

    static readonly MAX_HEIGHT = DeckDropZone.HEIGHT_OFFSET * DeckDropZone.MAX_CARDS_IN_COLUMN;

    private readonly columns: Set<CardImage>[];

    private readonly cardColumnMap: Map<CardImage, number>;

    private readonly camera: Phaser.Cameras.Scene2D.Camera;

    private readonly pileTexts: Phaser.GameObjects.Text[];

    private readonly thisX: number;

    private readonly thisY: number;

    constructor(
        scene: DeckBuilderScene,
        x: number,
        y: number,
        width: number,
        height: number,
        camera: Phaser.Cameras.Scene2D.Camera,
    ) {
        super(scene, x + width / 2, y + height / 2, width, height);
        this.thisX = this.x - this.width / 2;
        this.thisY = this.y - this.height / 2;
        this.camera = camera;
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
        const textY = this.thisY + DeckDropZone.HEIGHT_OFFSET / 2;
        this.pileTexts = [];
        for (let i = 0; i < DeckDropZone.MAX_COLUMNS; i++) {
            const textX =
                this.thisX + DeckDropZone.OFFSET + DeckDropZone.COLUMN_WIDTH / 3 + DeckDropZone.COLUMN_WIDTH * i;
            this.pileTexts[i] = scene.add.text(textX, textY, "0");
        }
        this.on(
            "wheel",
            (
                _pointer: Phaser.Input.Pointer,
                _deltaX: number,
                deltaY: number,
                _deltaZ: number,
                _event: Phaser.Types.Input.EventData,
            ) => {
                this.camera.scrollY += deltaY;
                const maxY = this.camera.y + DeckDropZone.MAX_HEIGHT;
                this.camera.scrollY = MathUtility.clamp(this.camera.scrollY, maxY, this.camera.y);
            },
        );
    }

    drawColumnPileSize(index: number) {
        const textY = this.thisY + DeckDropZone.HEIGHT_OFFSET / 2;
        const textX =
            this.thisX + DeckDropZone.OFFSET + DeckDropZone.COLUMN_WIDTH / 3 + DeckDropZone.COLUMN_WIDTH * index;
        this.pileTexts[index].setText("" + this.columns[index].size);
    }

    cardDrop(card: CardImage): void {
        this.removeCardFromColumns(card);
        const thisX = this.x - this.width / 2;
        let columnIndex = Math.max(
            0,
            Math.round(
                (card.x - DeckDropZone.OFFSET - thisX - DeckDropZone.COLUMN_WIDTH / 3) / DeckDropZone.COLUMN_WIDTH,
            ),
        );
        while (this.columns[columnIndex]?.size > DeckDropZone.MAX_CARDS_IN_COLUMN) {
            columnIndex++;
        }
        if (columnIndex >= this.columns.length) {
            if (columnIndex >= DeckDropZone.MAX_COLUMNS) {
                card.destroy();
                return;
            }
            this.columns.push(new Set());
            columnIndex = this.columns.length - 1;
        }
        this.columns[columnIndex].add(card);
        this.cardColumnMap.set(card, columnIndex);
        this.positionCardInColumn(card, columnIndex, this.columns[columnIndex].size - 1);
        this.drawColumnPileSize(columnIndex);
        card.on(
            "wheel",
            (
                pointer: Phaser.Input.Pointer,
                deltaX: number,
                deltaY: number,
                deltaZ: number,
                event: Phaser.Types.Input.EventData,
            ) => {
                this.emit("wheel", pointer, deltaX, deltaY, deltaZ, event);
            },
        );
    }

    positionCardInColumn(card: CardImage, columnIndex: number, index: number) {
        card.setX(
            this.thisX + DeckDropZone.OFFSET + DeckDropZone.COLUMN_WIDTH / 3 + DeckDropZone.COLUMN_WIDTH * columnIndex,
        );
        card.setY(this.thisY + card.displayHeight / 2 + (index + 1) * DeckDropZone.HEIGHT_OFFSET);
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
            this.drawColumnPileSize(index);
        }
    }
}

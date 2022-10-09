import Phaser from "phaser";

import Client from "../../Client";
import CardOracle from "../../../shared/game/card/CardOracle";
import CardImage from "../card/CardImage";
import log, { LOG_LEVEL } from "../../../shared/utility/Logger";
import DragNDropPickZone from "../zone/DragNDropPickZone";
import DeckDropZone from "../zone/DeckDropZone";
import Constants from "../../../shared/config/Constants";

function importAll(r: __WebpackModuleApi.RequireContext) {
    const images: Record<string, string> = {};
    r.keys().map((item, _index) => {
        images[item.replace("./", "")] = r(item).default;
    });
    return images;
}

const images = importAll(require.context("../../../client/resources/images", false, /\.(png|jpe?g|svg)$/));
export default class DeckBuilderScene extends Phaser.Scene {
    instanceUpdatePool: Map<string, Phaser.GameObjects.GameObject>;

    deckDropZone: DeckDropZone;

    constructor(client: Client) {
        const config: Phaser.Types.Scenes.SettingsConfig = {
            active: true,
        };
        super(config);
        this.instanceUpdatePool = new Map<string, Phaser.GameObjects.GameObject>();
    }

    preload() {
        CardOracle.getAllCardNames().forEach((cardName) => {
            this.load.image(cardName, images[`${cardName}.jpg`]);
        });
    }

    create() {
        const deckPickCamera = this.cameras.main;
        deckPickCamera.setViewport(2, 2, this.game.canvas.width - 4, Constants.CARD_SIZE.HEIGHT + 20);
        const pickFromZone = new DragNDropPickZone(
            this,
            2,
            2,
            (CardOracle.getAllCardNames().length + 1) * Constants.CARD_SIZE.WIDTH,
            Constants.CARD_SIZE.HEIGHT + 20,
            deckPickCamera,
        );
        const deckBuildCamera = this.cameras.add(
            2,
            pickFromZone.height + 8,
            this.game.canvas.width - 4,
            this.game.canvas.height - 4 - 208,
        );
        deckBuildCamera.scrollX = deckBuildCamera.x;
        deckBuildCamera.scrollY = deckBuildCamera.y;
        this.deckDropZone = new DeckDropZone(
            this,
            2,
            pickFromZone.height + 8,
            this.game.canvas.width - 4,
            DeckDropZone.MAX_HEIGHT + 2 * Constants.CARD_SIZE.HEIGHT,
            deckBuildCamera,
        );
        this.input.on("dragstart", (pointer: Phaser.Input.Pointer, gameObject: CardImage) => {
            gameObject.setTint(0xff69b4);
        });

        this.input.on("dragend", (pointer: Phaser.Input.Pointer, gameObject: CardImage, dropped: boolean) => {
            gameObject.setTint();
        });
        this.input.on(
            "drop",
            (
                pointer: Phaser.Input.Pointer,
                gameObject: Phaser.GameObjects.GameObject,
                dropZone: Phaser.GameObjects.Zone,
            ) => {
                log(`dropping gameobject ${gameObject}`, this, LOG_LEVEL.INFO);
                if (gameObject instanceof CardImage) {
                    if (dropZone instanceof DragNDropPickZone) {
                        this.instanceUpdatePool.delete(gameObject.id);
                        this.deckDropZone?.removeCardFromColumns(gameObject);
                        gameObject.destroy();
                    } else if (dropZone instanceof DeckDropZone) {
                        dropZone.cardDrop(gameObject);
                    }
                }
            },
        );
    }

    update(time: number, delta: number) {
        super.update(time, delta);
        this.instanceUpdatePool.forEach((gameObject) => {
            gameObject.update();
        });
    }

    static getSceneName(): string {
        return this.constructor.name;
    }
}

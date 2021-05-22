import Phaser from "phaser";

import Client from "../../Client";

export default class GameScene extends Phaser.Scene {
    constructor(client: Client) {
        const config: Phaser.Types.Scenes.SettingsConfig = {
            active: false,
        };
        super(config);
    }

    preload() {}

    create() {}

    update(time: number, delta: number) {
        super.update(time, delta);
    }

    static getSceneName(): string {
        return "GameScene";
    }
}

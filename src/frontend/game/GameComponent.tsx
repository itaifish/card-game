import * as React from "react";
import Client from "../../client/Client";

export interface GameComponentProps {
    client: Client;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GameComponentState {}

class GameComponent extends React.Component<GameComponentProps, GameComponentState> {
    constructor(props: GameComponentProps) {
        super(props);
    }

    render() {
        return <></>;
    }
}

export default GameComponent;

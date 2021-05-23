import * as React from "react";
import log from "../../shared/utility/Logger";
import { ClientLobby } from "../../shared/communication/messageInterfaces/MessageInterfaces";

export interface LobbyComponentProps {
    lobby: ClientLobby;
    onClickJoin: (lobbyIdx: number) => void;
    index: number;
    joined: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LobbyComponentState {}

class LobbyComponent extends React.Component<LobbyComponentProps, LobbyComponentState> {
    constructor(props: LobbyComponentProps) {
        super(props);
        this.state = {};
    }
    render() {
        return (
            <>
                <tr
                    className={this.props.joined ? "table-primary" : ""}
                    onClick={() => {
                        this.props.onClickJoin(this.props.index);
                    }}
                >
                    <th scope="row">{this.props.index + 1}</th>
                    <td>{this.props.lobby.settings.lobbyName}</td>
                    <td>{this.props.lobby.players.length} / 2</td>
                    <td>{this.props.lobby.id}</td>
                    <td>{this.props.lobby.lobbyLeader}</td>
                    <td>{"mapName"}</td>
                </tr>
            </>
        );
    }
}

export default LobbyComponent;

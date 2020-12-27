import * as React from "react";
import LobbySettings from "../../server/room/lobby/lobbySettings";

export interface LobbyCreatorComponentProps {
    username: string;
    createLobby: (settings: LobbySettings) => void;
}

export interface LobbyCreatorComponentState {
    settings: LobbySettings;
}

class LobbyCreatorComponent extends React.Component<LobbyCreatorComponentProps, LobbyCreatorComponentState> {
    constructor(props: LobbyCreatorComponentProps) {
        super(props);
        this.state = {
            settings: {
                maxPlayersPerTeam: 1,
                numTeams: 2,
                turnTime: 0,
                mapId: "1",
                lobbyName: `${this.props.username}'s Lobby`,
            },
        };
        this.setLobbyName = this.setLobbyName.bind(this);
        this.setMapId = this.setMapId.bind(this);
    }

    setLobbyName(lobbyName: string) {
        this.setState((prevState, _props) => {
            return {
                settings: {
                    ...prevState.settings,
                    lobbyName: lobbyName,
                },
            };
        });
    }

    setMapId(mapId: string) {
        this.setState((prevState, _props) => {
            return {
                settings: {
                    ...prevState.settings,
                    mapId: mapId,
                },
            };
        });
    }

    render() {
        return (
            <div className="col-4 text-center justify-content-center" style={{ backgroundColor: "white" }}>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        this.props.createLobby(this.state.settings);
                    }}
                >
                    <div className="form-group">
                        <label htmlFor="lobbyName">Lobby Name:</label>
                        <input
                            type="text"
                            id="lobbyName"
                            value={this.state.settings.lobbyName}
                            className="form-control"
                            onChange={(event) => {
                                this.setLobbyName(event.target.value);
                            }}
                        />
                    </div>
                    <button className="btn btn-primary" type="submit" value="Submit">
                        Create Lobby
                    </button>
                </form>
            </div>
        );
    }
}

export default LobbyCreatorComponent;

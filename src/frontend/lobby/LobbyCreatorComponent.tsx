import * as React from "react";
import GameSettings from "../../shared/game/settings/GameSettings";

export interface LobbyCreatorComponentProps {
    username: string;
    createLobby: (settings: GameSettings) => void;
}

export interface LobbyCreatorComponentState {
    settings: GameSettings;
}

class LobbyCreatorComponent extends React.Component<LobbyCreatorComponentProps, LobbyCreatorComponentState> {
    constructor(props: LobbyCreatorComponentProps) {
        super(props);
        this.state = {
            settings: {
                startingLife: 20,
                numPlayers: 2,
                bannedList: [],
                playersPerTeam: 1,
                numTeams: 2,
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

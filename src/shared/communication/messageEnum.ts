enum MessageEnum {
    CREATE_ACCOUNT = "create",
    LOGIN = "login",
    DISCONNECT = "disconnect", // Reserved namespace
    ERROR = "error", // Reserved namespace
    CONNECT = "connect",
    GET_LOBBIES = "get lobbies",
    JOIN_LOBBY = "join lobby",
    CREATE_LOBBY = "create lobby",
    START_GAME = "start game",
    CONCEDE = "i give in!!!!",
    GAME_HAS_ENDED = "game over gg wp no re",
    PASSED_PRIORITY = "your go broski",
    CHOOSE_TARGETS = "choose targets",
}

export default MessageEnum;

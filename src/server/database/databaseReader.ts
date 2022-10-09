import { User, UserStatus } from "../manager/UserPlayerManager";
import CardInstance from "../../shared/game/card/CardInstance";

export default class DatabaseReader {
    loadUsers(): User[] {
        return [
            {
                username: "user1",
                password: "1234",
                status: UserStatus.OFFLINE,
                id: 0,
            },
            {
                username: "user2",
                password: "1234",
                status: UserStatus.OFFLINE,
                id: 1,
            },
        ];
    }

    loadUserDecks(userId: number): CardInstance[][] {
        return null;
    }

    saveUserDeck(userId: number, deck: CardInstance[]): void {}

    getRunningId(): number {
        return 1;
    }
}

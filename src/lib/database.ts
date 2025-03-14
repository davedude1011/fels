import { get, ref, set } from "firebase/database";
import { db } from "./firebase";
import { Board } from "~/app/logic/board";

export function create_game() {
    const game_id = crypto.randomUUID();
    
    set(ref(db, `games/${game_id}/board`), (new Board({})).serialize());
    set(ref(db, `games/${game_id}/players`), []);

    return game_id;
}

export async function deserialize_board(game_id: string) {
    const snapshot = await get(ref(db, `games/${game_id}/board`));

    if (snapshot.exists()) {
        return Board.deserialize(snapshot.val());
    }
    return undefined;
}

export function update_board(board: Board, game_id: string) {
    console.log(board.serialize())
    set(ref(db, `games/${game_id}/board`), board.serialize());
}

export async function join_game(game_id: string, existing_user_id: string) {
    const user_id = crypto.randomUUID();
    const snapshot = await get(ref(db, `games/${game_id}/players`));

    if (snapshot.exists()) {
        if (snapshot.val().includes(existing_user_id)) return existing_user_id;

        set(ref(db, `games/${game_id}/players`), [...snapshot.val(), user_id]);
    }
    else {
        set(ref(db, `games/${game_id}/players`), [user_id]);
    }
    return user_id;
}

export async function select_random_player_teams(game_id: string) {
    const snapshot = await get(ref(db, `games/${game_id}/players`));

    if (snapshot.exists()) {
        const players = snapshot.val();

        if (players.length > 1) {
            const shuffledPlayers = [...players].sort(() => Math.random() - 0.5); // Shuffle array

            const team_white = shuffledPlayers[0];
            const team_black = shuffledPlayers.length > 1 ? shuffledPlayers[1] : "";
            const team_red = shuffledPlayers.length > 2 ? shuffledPlayers[2] : "";

            await set(ref(db, `games/${game_id}/team_white`), team_white);
            await set(ref(db, `games/${game_id}/team_black`), team_black);
            await set(ref(db, `games/${game_id}/team_red`), team_red);
        }
    }
}
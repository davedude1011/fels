import { immerable, produce } from "immer";

export class Board {
    [immerable] = true;
    
    squares: Square[];
    selected_square?: Square;
    movable_squares: Square[];
    turn: number;

    constructor({ squares, selected_square, movable_squares, turn }: {
        squares?: Square[],
        selected_square?: Square,
        movable_squares?: Square[],
        turn?: number,
    }) {
        this.squares = squares ?? this.generate_default_squares();
        this.selected_square = selected_square;
        this.movable_squares = movable_squares ?? [];
        this.turn = turn ?? 1;
    }

    private generate_default_squares() {
        const blueprint = [
            Rook,   Pawn, undefined, undefined, undefined, undefined, Pawn, Rook,
            Knight, Pawn, undefined, undefined, undefined, undefined, Pawn, Knight,
            Bishop, Pawn, undefined, undefined, undefined, undefined, Pawn, Bishop,
            Queen,  Pawn, undefined, undefined, undefined, undefined, Pawn, Queen,
            King,   Pawn, undefined, undefined, undefined, undefined, Pawn, King,
            Bishop, Pawn, undefined, undefined, undefined, undefined, Pawn, Bishop,
            Knight, Pawn, undefined, undefined, undefined, undefined, Pawn, Knight,
            Rook,   Pawn, undefined, undefined, undefined, undefined, Pawn, Rook
        ] as (typeof Pawn | typeof Knight | typeof Bishop | typeof Rook | typeof Queen | typeof King | undefined)[]
        const squares = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const index = i * 8 + j;
                const position = [i, j] as [number, number];
                const color = (i + j) % 2 == 0 ? 0x8c7a5b : 0x3b1b0a
                const piece_data = { index, position, color } as {
                    index: number,
                    position: [number, number],
                    color: number,
                    piece?: AnyPiece,
                }

                if (blueprint[index]) {
                    piece_data.piece = new blueprint[index]({
                        team: j < 2 ? 2 : 1,
                    });
                }

                squares.push(new Square(piece_data));
            }
        }
        return squares;
    }

    move_to_square(square: Square) {
        if (this.selected_square?.piece) {
            square.piece = this.selected_square.piece;
            square.piece.has_moved = true;
            this.selected_square.piece = undefined;
        }
    }

    find_square(position: [number, number] | undefined) {
        if (position === undefined) return undefined;
        
        for (const square of this.squares) {
            if (square.position[0] == position[0] && square.position[1] == position[1]) {
                return square;
            }
        }
        return undefined;
    }

    get_foriegn_attack_squares(your_team: number) {
        let enemy_attack_squares: Square[] = [];
        for (const square of this.squares) { // check for any checks
            if (square.piece?.team && square.piece.team != your_team && square.piece.name != "king") {
                const piece_movable_squares = square.piece.get_movable_squares({ current_square: square, board: this, skip_check_check: true });
                if (piece_movable_squares?.length) {
                    enemy_attack_squares = [...enemy_attack_squares, ...piece_movable_squares];
                }
            }
        }
        return enemy_attack_squares;
    }

    is_in_check(team: number) {
        for (const square of this.squares) {
            if (square.piece?.name == "king" && square.piece.team == team) {
                if (this.get_foriegn_attack_squares(team).includes(square)) return true;
                return false;
            }
        }
        return false;
    }

    serialize() {
        return {
            squares: this.squares.map(square => square.serialize()),
            selected_square: this.selected_square?.serialize() ?? null,
            movable_squares: this.movable_squares.map(square => square.serialize()),
            turn: this.turn,
        }
    }

    static deserialize(board_data: {
        squares: {
            color: number,
            index: number,
            piece?: {
                glb_path: string,
                has_moved: boolean,
                id: string,
                name: string,
                team: number,
            },
            position: [number, number],
        }[],
        selected_square?: {
            color: number,
            index: number,
            piece?: {
                glb_path: string,
                has_moved: boolean,
                id: string,
                name: string,
                team: number,
            },
            position: [number, number],
        },
        movable_squares?: {
            color: number,
            index: number,
            piece?: {
                glb_path: string,
                has_moved: boolean,
                id: string,
                name: string,
                team: number,
            },
            position: [number, number],
        }[],
        turn: number,
    }) {
        const squares = board_data.squares.map(square_data => Square.deserialize(square_data))
        return new Board({
            squares: squares,
            selected_square: squares.find(square => square.index == board_data.selected_square?.index),
            movable_squares: board_data.movable_squares?.map(square_data => squares.find(square => square.index == square_data.index)) as Square[],
            turn: board_data.turn,
        })
    }
}

export class Square {
    [immerable] = true;

    piece?: AnyPiece;
    index: number;
    position: [number, number];
    color: number;

    constructor({ piece, index, position, color }: {
        piece?: AnyPiece
        index: number,
        position: [number, number],
        color: number,
    }) {
        if (piece) this.piece = piece;
        this.index = index;
        this.position = position;
        this.color = color;
    }

    serialize() {
        return {
            piece: this.piece?.serialize() ?? null,
            index: this.index,
            position: this.position,
            color: this.color,
        }
    }

    static deserialize(square_data: {
        color: number,
        index: number,
        piece?: {
            glb_path: string,
            has_moved: boolean,
            id: string,
            name: string,
            team: number,
        },
        position: [number, number],
    }) {
        return new Square({
            color: square_data.color,
            index: square_data.index,
            piece: square_data.piece ? Piece.deserialize(square_data.piece) : undefined,
            position: square_data.position,
        })
    }
}

export class Piece {
    static colors = {
        1: 0xe3a57f,
        2: 0x61402c,
    };
    static rotations = {
        1: [0, Math.PI, 0],
        2: [0, Math.PI * 2, 0],
    }

    id: string;
    name: string;
    glb_path: string;
    team: number;
    has_moved: boolean;

    constructor({ id, team, has_moved }: {
        id?: string,
        team: number,
        has_moved?: boolean,
    }) {
        this.id = id ?? crypto.randomUUID();
        this.team = team;
        this.name = "PIECE_NAME";
        this.glb_path = "GLB_PATH";
        this.has_moved = has_moved ?? false;
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            glb_path: this.glb_path,
            team: this.team,
            has_moved: this.has_moved,
        }
    }

    static deserialize(piece_data: {
        glb_path: string,
        has_moved: boolean,
        id: string,
        name: string,
        team: number,
    }) {
        if (piece_data.name == "pawn") {
            return new Pawn({
                glb_path: piece_data.glb_path,
                has_moved: piece_data.has_moved,
                id: piece_data.id,
                name: piece_data.name,
                team: piece_data.team,
            })
        }
        else if (piece_data.name == "knight") {
            return new Knight({
                glb_path: piece_data.glb_path,
                has_moved: piece_data.has_moved,
                id: piece_data.id,
                name: piece_data.name,
                team: piece_data.team,
            })
        }
        else if (piece_data.name == "bishop") {
            return new Bishop({
                glb_path: piece_data.glb_path,
                has_moved: piece_data.has_moved,
                id: piece_data.id,
                name: piece_data.name,
                team: piece_data.team,
            })
        }
        else if (piece_data.name == "rook") {
            return new Rook({
                glb_path: piece_data.glb_path,
                has_moved: piece_data.has_moved,
                id: piece_data.id,
                name: piece_data.name,
                team: piece_data.team,
            })
        }
        else if (piece_data.name == "queen") {
            return new Queen({
                glb_path: piece_data.glb_path,
                has_moved: piece_data.has_moved,
                id: piece_data.id,
                name: piece_data.name,
                team: piece_data.team,
            })
        }
        else if (piece_data.name == "king") {
            return new King({
                glb_path: piece_data.glb_path,
                has_moved: piece_data.has_moved,
                id: piece_data.id,
                name: piece_data.name,
                team: piece_data.team,
            })
        }
    }
}
export type AnyPiece = Pawn | Knight | Bishop | Rook | Queen | King;

export class Pawn extends Piece {
    constructor({ id, name, glb_path, team, has_moved }: {
        id?: string,
        name?: string,
        glb_path?: string,
        team: number,
        has_moved?: boolean,
    }) {
        super({ id, team, has_moved });

        this.name = name ?? "pawn";
        this.glb_path = glb_path ?? "/models/pawn.glb";
    }

    get_movable_squares({ current_square, board, skip_check_check = false }: {
        current_square: Square,
        board: Board,
        skip_check_check?: boolean,
    }) {
        if (!current_square.piece) return undefined;
        if (!skip_check_check && board.is_in_check(current_square.piece.team)) return undefined;

        const team = current_square.piece.team;
        const movable_squares: Square[] = [];

        const forward_square = board.find_square(
            team == 1 ? [current_square.position[0], current_square.position[1]-1] :
            team == 2 ? [current_square.position[0], current_square.position[1]+1] : undefined
        );
        if (forward_square && forward_square.piece === undefined && !skip_check_check) movable_squares.push(forward_square);

        if (!this.has_moved && forward_square?.piece === undefined) {
            const twice_forward_square = board.find_square(
                team == 1 ? [current_square.position[0], current_square.position[1]-2] :
                team == 2 ? [current_square.position[0], current_square.position[1]+2] : undefined
            );
            if (twice_forward_square && twice_forward_square.piece === undefined && !skip_check_check) movable_squares.push(twice_forward_square);
        }

        for (const [dx, dy] of [ // diagonals
            [-1, team == 1 ? -1 : +1],
            [+1, team == 1 ? -1 : +1],
        ] as [number, number][]) {
            const movable_square = board.find_square([
                current_square.position[0] + dx,
                current_square.position[1] + dy,
            ])

            if (movable_square && (skip_check_check || (movable_square.piece && movable_square.piece.team !== current_square.piece.team))) movable_squares.push(movable_square);
        }

        return movable_squares;
    }
}

export class Knight extends Piece {
    constructor({ id, name, glb_path, team, has_moved }: {
        id?: string,
        name?: string,
        glb_path?: string,
        team: number,
        has_moved?: boolean,
    }) {
        super({ id, team, has_moved });

        this.name = name ?? "knight";
        this.glb_path = glb_path ?? "/models/knight.glb";
    }

    get_movable_squares({ current_square, board, skip_check_check = false }: {
        current_square: Square,
        board: Board,
        skip_check_check?: boolean,
    }) {
        if (!current_square.piece) return undefined;
        if (!skip_check_check && board.is_in_check(current_square.piece.team)) return undefined;

        const movable_squares: Square[] = [];

        for (const offset of [
            [-1, -2], [+1, -2],
            [-2, -1], [-2, +1],
            [+2, -1], [+2, +1],
            [-1, +2], [+1, +2],
        ] as [number, number][]) {
            const movable_square = board.find_square([
                current_square.position[0] + offset[0],
                current_square.position[1] + offset[1],
            ])

            if (movable_square && (skip_check_check || (movable_square.piece?.team != current_square.piece.team))) movable_squares.push(movable_square);
        }

        return movable_squares;
    }
}

export class Bishop extends Piece {
    constructor({ id, name, glb_path, team, has_moved }: {
        id?: string,
        name?: string,
        glb_path?: string,
        team: number,
        has_moved?: boolean,
    }) {
        super({ id, team, has_moved });

        this.name = name ?? "bishop";
        this.glb_path = glb_path ?? "/models/bishop.glb";
    }

    get_movable_squares({ current_square, board, skip_check_check = false }: {
        current_square: Square,
        board: Board,
        skip_check_check?: boolean,
    }) {
        if (!current_square.piece) return undefined;
        if (!skip_check_check && board.is_in_check(current_square.piece.team)) return undefined;

        const movable_squares: Square[] = [];
        
        for (const [dx, dy] of [
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ] as [number, number][]) {
            let offset = 1;
            let square = board.find_square([current_square.position[0] + dx * offset, current_square.position[1] + dy * offset]);
            
            while (square) {
                if (square.piece) {
                    if (square.piece.team != current_square.piece.team) movable_squares.push(square);
                    break;
                }
                
                movable_squares.push(square);
                offset++;
                square = board.find_square([current_square.position[0] + dx * offset, current_square.position[1] + dy * offset]);
            }
        }
        
        return movable_squares;
    }
}

export class Rook extends Piece {
    constructor({ id, name, glb_path, team, has_moved }: {
        id?: string,
        name?: string,
        glb_path?: string,
        team: number,
        has_moved?: boolean,
    }) {
        super({ id, team, has_moved });

        this.name = name ?? "rook";
        this.glb_path = glb_path ?? "/models/rook.glb";
    }

    get_movable_squares({ current_square, board, skip_check_check = false }: {
        current_square: Square,
        board: Board,
        skip_check_check?: boolean,
    }) {
        if (!current_square.piece) return undefined;
        if (!skip_check_check && board.is_in_check(current_square.piece.team)) return undefined;

        const movable_squares: Square[] = [];

        for (const [dx, dy] of [
            [0, -1], [0, +1], [-1, 0], [+1, 0],
        ] as [number, number][]) {
            let offset = 1;
            let square = board.find_square([current_square.position[0] + dx * offset, current_square.position[1] + dy * offset]);
            
            while (square) {
                if (square.piece) {
                    if (square.piece.team != current_square.piece.team) movable_squares.push(square);
                    break;
                }

                movable_squares.push(square);
                offset++;
                square = board.find_square([current_square.position[0] + dx * offset, current_square.position[1] + dy * offset]);
            }
        }

        return movable_squares;
    }
}

export class Queen extends Piece {
    constructor({ id, name, glb_path, team, has_moved }: {
        id?: string,
        name?: string,
        glb_path?: string,
        team: number,
        has_moved?: boolean,
    }) {
        super({ id, team, has_moved });

        this.name = name ?? "queen";
        this.glb_path = glb_path ?? "/models/queen.glb";
    }

    get_movable_squares({ current_square, board, skip_check_check = false }: {
        current_square: Square,
        board: Board,
        skip_check_check?: boolean,
    }) {
        if (!current_square.piece) return undefined;
        if (!skip_check_check && board.is_in_check(current_square.piece.team)) return undefined;

        const movable_squares: Square[] = [];

        for (const [dx, dy] of [
            [0, -1], [0, +1], [-1, 0], [+1, 0],
            [-1, -1], [-1, +1], [+1, -1], [+1, +1],
        ] as [number, number][]) {
            let offset = 1;
            let square = board.find_square([current_square.position[0] + dx * offset, current_square.position[1] + dy * offset]);
            
            while (square) {
                if (square.piece) {
                    if (square.piece.team != current_square.piece.team) movable_squares.push(square);
                    break;
                }

                movable_squares.push(square);
                offset++;
                square = board.find_square([current_square.position[0] + dx * offset, current_square.position[1] + dy * offset]);
            }
        }

        return movable_squares;
    }
}

export class King extends Piece {
    constructor({ id, name, glb_path, team, has_moved }: {
        id?: string,
        name?: string,
        glb_path?: string,
        team: number,
        has_moved?: boolean,
    }) {
        super({ id, team, has_moved });

        this.name = name ?? "king";
        this.glb_path = glb_path ?? "/models/king.glb";
    }

    get_movable_squares({ current_square, board, skip_check_check = false }: {
        current_square: Square,
        board: Board,
        skip_check_check?: boolean,
    }) {
        if (!current_square.piece) return undefined;

        const movable_squares: Square[] = [];

        for (const [dx, dy] of [
            [0, -1], [0, +1], [-1, 0], [+1, 0],
            [-1, -1], [-1, +1], [+1, -1], [+1, +1],
        ] as [number, number][]) {
            const movable_square = board.find_square([
                current_square.position[0] + dx,
                current_square.position[1] + dy,
            ]);

            if (movable_square && movable_square.piece?.team != current_square.piece.team) {
                if (!board.get_foriegn_attack_squares(current_square.piece.team).includes(movable_square)) movable_squares.push(movable_square);
            }
        }

        return movable_squares;
    }
}
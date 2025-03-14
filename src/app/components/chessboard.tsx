import { Clone, SpotLight, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react"
import { AnyPiece, Board, Square } from "../logic/board";
import PieceElement from "./piece";
import { produce } from "immer";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { SamAudio } from "../logic/audio";
import { useParams } from "next/navigation";
import { deserialize_board, join_game, update_board } from "~/lib/database";
import { onValue, ref } from "firebase/database";
import { db } from "~/lib/firebase";

export default function Chessboard({ game_id, USER_TEAM, board, piece_components, audio }: {
    game_id: string,
    USER_TEAM: number,
    board: Board,
    piece_components,
    audio: SamAudio,
}) {
    function handle_select_square(selected_square: Square) {
        if (!board) return;

        const movable_squares = selected_square.piece?.get_movable_squares({
            current_square: selected_square,
            board: board,
        })

        if (movable_squares !== undefined && movable_squares.length > 0) {
            board.movable_squares = (selected_square == board.selected_square ? [] : movable_squares);
            board.selected_square = (selected_square == board.selected_square ? undefined : selected_square);
            
            update_board(board, game_id);
        }
    }

    function handle_move_to_square(square: Square) {
        if (!board) return;

        board.move_to_square(square);
        board.selected_square = undefined;
        board.movable_squares = [];
        board.turn = (board.turn % 2) + 1;

        update_board(board, game_id);
    }

    return (
        <>
            <group position={[-3.5, 0, -3.5]}>
                {
                    board?.squares.map(square => (
                        <group key={square.index} position={[square.position[0], 0, square.position[1]]} onPointerDown={(e) => {
                            e.stopPropagation();

                            if (board.turn == USER_TEAM && square.piece?.team == USER_TEAM) {
                                handle_select_square(square);
                            }
                            else {
                                if (board.movable_squares.includes(square)) handle_move_to_square(square);
                                else if (board.selected_square) {
                                    audio.play({
                                        // @ts-expect-error just deal with it ok
                                        phrase: [
                                            "I cannot move there",
                                            "I cant",
                                            "I refuse",
                                            "I dont want to",
                                            "No",
                                        ][Math.floor(Math.random() * 5)],
                                        chance: 0.25,
                                    });
                                }
                            }
                        }}>
                            <mesh>
                                <boxGeometry args={[
                                    1,
                                    0.2,
                                    1,
                                ]} />
                                
                                {
                                    board.movable_squares.includes(square) ? (
                                        <meshPhysicalMaterial 
                                            color={square.color} 
                                            emissive={0xffffff} 
                                            emissiveIntensity={0.2} // Glow strength
                                        />
                                    ) : (
                                        <meshStandardMaterial color={ square.color } />
                                    )
                                }
                            </mesh>
                        </group>
                    ))
                }
                {
                    piece_components.map(({ key, piece, position, is_selected }) => (
                        <PieceElement {...{ key, piece, position, is_selected }} />
                    ))
                }
            </group>
        </>
    )
  }
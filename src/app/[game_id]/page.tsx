"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Vignette, ChromaticAberration, Noise, Bloom, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { db } from "~/lib/firebase";
import { create_game, deserialize_board, join_game, select_random_player_teams } from "~/lib/database";
import Chessboard from "../components/chessboard";
import Warden from "../components/warden";
import { SamAudio } from "../logic/audio";
import { useParams } from "next/navigation";
import { AnyPiece, Board } from "../logic/board";
import { BoxGeometry, MeshStandardMaterial } from "three";

export default function App() {
    const effects = true;
    const { game_id }: { game_id: string } = useParams();

    const audio = new SamAudio();
    const [user_id, set_user_id] = useState<string>(localStorage.getItem("user_id") ?? "");
    const [USER_TEAM, set_USER_TEAM] = useState(0);
    const [board, set_board] = useState<Board>();
    const [piece_components, set_piece_components] = useState([]);

    let has_joined_game = useRef(false);
    useEffect(() => { // initial load
        if (has_joined_game.current) return;
        has_joined_game.current = true;

        join_game(game_id, user_id).then((user_id) => {
            localStorage.setItem("user_id", user_id);
            set_user_id(user_id);
        });
        deserialize_board(game_id).then(deserialized_board => {
            if (deserialized_board) {
                const temp_piece_components: ((prevState: never[]) => never[]) | { key: string; piece: AnyPiece; position: [number, number]; is_selected: boolean; }[] = []
                deserialized_board.squares.forEach(square => {
                    if (square.piece) {
                        temp_piece_components.push({
                            key: square.piece.id,
                            piece: square.piece,
                            position: square.position,
                            is_selected: deserialized_board.selected_square === square,
                        });
                    }
                })
                set_piece_components(temp_piece_components);
                set_board(deserialized_board)
            }
        });
    }, [])

    useEffect(() => {
        const unsubscribe = onValue(ref(db, `games/${game_id}/board`), (snapshot) => {
            if (snapshot.exists()) {
                const deserialized_board = Board.deserialize(snapshot.val())
                const temp_piece_components: ((prevState: never[]) => never[]) | { key: string; piece: AnyPiece; position: [number, number]; is_selected: boolean; }[] = []
                deserialized_board.squares.forEach(square => {
                    if (square.piece) {
                        temp_piece_components.push({
                            key: square.piece.id,
                            piece: square.piece,
                            position: square.position,
                            is_selected: deserialized_board.selected_square === square,
                        });
                    }
                })
                set_piece_components(temp_piece_components);
                set_board(deserialized_board);
            };
        })
        return () => unsubscribe();
    }, [])

    useEffect(() => {
        const unsubscribe = onValue(ref(db, `games/${game_id}/team_white`), (snapshot) => {
            if (snapshot.exists()) {
                if (user_id == snapshot.val()) {
                    set_USER_TEAM(1);
                }
            };
        })
        return () => unsubscribe();
    }, [user_id])

    useEffect(() => {
        const unsubscribe = onValue(ref(db, `games/${game_id}/team_black`), (snapshot) => {
            if (snapshot.exists()) {
                if (user_id == snapshot.val()) {
                    set_USER_TEAM(2);
                }
                console.log(user_id, snapshot.val())
            };
        })
        return () => unsubscribe();
    }, [user_id])

    useEffect(() => {
        const unsubscribe = onValue(ref(db, `games/${game_id}/team_red`), (snapshot) => {
            if (snapshot.exists()) {
                if (user_id == snapshot.val()) {
                    set_USER_TEAM(3);
                }
            };
        })
        return () => unsubscribe();
    }, [user_id])

    return (
        <div className="w-screen h-screen bg-black">
            <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
                <ambientLight intensity={1} />
                <directionalLight position={[5, 5, 5]} intensity={8} color={"#ff4400"} />

                {
                    USER_TEAM && board ? (
                        <Chessboard
                            {...{
                                game_id,
                                USER_TEAM,
                                board,
                                piece_components,
                                audio,
                            }}
                        />
                    ) : (
                        <mesh onPointerDown={() => {
                            select_random_player_teams(game_id)
                        }}>
                            <boxGeometry />
                            <meshStandardMaterial />
                        </mesh>
                    )
                }
                
                <Warden />


                <OrbitControls />
                
                {
                effects && (
                    <EffectComposer>
                    <Vignette eskil={false} offset={0.2} darkness={1.1} />
                    <ChromaticAberration offset={[0.002, 0.002]} />
                    <Noise opacity={0.2} />
                    <Bloom intensity={0.3} luminanceThreshold={0.2} luminanceSmoothing={0.1} />
                    <ToneMapping mode={2} exposure={0.8} />
                    </EffectComposer>
                )
                }
            </Canvas>
        </div>
    );
}
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";
import { Color } from "three";
import { useSpring, a } from "@react-spring/three"; // Import animation
import { AnyPiece, Piece } from "../logic/board";

export default function PieceElement({ piece, position, is_selected }: {
    piece: AnyPiece,
    position: [number, number],
    is_selected: boolean
}) {
    const { scene } = useGLTF(piece.glb_path);

    const clonedScene = useMemo(() => {
        const newScene = SkeletonUtils.clone(scene);

        newScene.traverse((object) => {
            if (object.isMesh && object.material) {
                object.material = object.material.clone();
                object.material.color = new Color(Piece.colors[piece.team]);
            }
        });

        return newScene;
    }, [scene, piece.team]);

    const animated_props = useSpring({
        position_x: position[0] + (Math.random()/50 * (Math.random() > .5 ? 1 : -1)),
        position_y: (is_selected ? 0.25 : 0.1) + (Math.random()/50 * (Math.random() > .5 ? 1 : -1)),
        position_z: position[1] + (Math.random()/50 * (Math.random() > .5 ? 1 : -1)),
        rotation_x: (Math.random() / 10 * (Math.random() > .5 ? 1 : -1)),
        rotation_y: (Math.random() / 10 * (Math.random() > .5 ? 1 : -1)),
        rotation_z: (Math.random() / 10 * (Math.random() > .5 ? 1 : -1)),
        config: { mass: 1, tension: Math.random()*500, friction: Math.random() * 100 },
    });

    return (
        <a.group
            position-x={animated_props.position_x}
            position-y={animated_props.position_y}
            position-z={animated_props.position_z}
            rotation-x={animated_props.rotation_x}
            rotation-y={animated_props.rotation_y}
            rotation-z={animated_props.rotation_z}
        >
            <primitive object={clonedScene} scale={0.02} rotation={Piece.rotations[piece.team]} />
        </a.group>
    )
}

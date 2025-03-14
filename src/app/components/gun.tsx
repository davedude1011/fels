import { useGLTF } from "@react-three/drei";
import { SamAudio } from "../logic/audio";

export default function Gun({ type, onclick }: {
    type: number,
    onclick: () => void,
}) {
    const { scene } = useGLTF(`/models/gun${type}.glb`);

    return (
        <primitive position={
            type == 1 ? [-2, 0, -1] :
            type == 2 ? [0, 0, -2] : 
            type == 3 ? [2, 0, -2] : [0,0,0]
        } object={scene} scale={
            type == 1 ? 1 :
            type == 2 ? .02 :
            type == 3 ? 1 : 0
        } rotation={
            type == 1 ? [0, Math.PI * 1.56, 0.4] :
            type == 2 ? [0, Math.PI * 1.5, 0.3] : 
            type == 3 ? [0, Math.PI * 1.45, 0.25] : [0,0,0]
        } onPointerDown={(e) => {
            e.stopPropagation();

            onclick()
        }} />
    )
}

import { useGLTF } from "@react-three/drei";
import { SamAudio } from "../logic/audio";

export default function Warden() {
    const { scene } = useGLTF("/models/warden.glb");

    const light_warden = false;

    return (
        <>
            <primitive position={[30, 8, 0]} object={scene} scale={100} rotation={[0, Math.PI * 1.5, 0]} onPointerDown={(e) => {
                e.stopPropagation();

               
            }} />
            {
                light_warden && (
                    <directionalLight
                        position={[10, 20, -10]}
                        intensity={2}
                        color={"#bbbbbb"}
                        castShadow
                    />
                )
            }
        </>
    )
}

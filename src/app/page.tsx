"use client"

import { useRouter } from "next/navigation";
import { create_game } from "~/lib/database"

export default function() {
  const router = useRouter();
  
  return (
    <div>
      <button onClick={() => {
        const game_id = create_game();
        router.push(`/${game_id}`);
      }}>Create Game</button>
    </div>
  )
}
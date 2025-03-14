type AudioPhrase =  | "I cannot move there"
                    | "I cant"
                    | "I dont want to"
                    | "I refuse"
                    | "No"
                    | "I am the warden would you like to make a deal"
export class SamAudio {
    private currentAudio: HTMLAudioElement | null = null;

    play({ phrase, chance = 1 }: {
        phrase: AudioPhrase,
        chance?: number,
    }) {
        if (Math.random() > chance) return;

        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }

        this.currentAudio = new Audio(`/audio/${phrase.replaceAll(" ", "-").toLowerCase()}.wav`);
        this.currentAudio.play();
    }
}
                    
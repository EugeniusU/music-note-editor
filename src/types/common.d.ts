
type NoteObj = {
    key: string;
    octave: number;
    isSharp: boolean;
    duration: NoteDurations,
};

type GuitarTuning = {
    [stringIndex: string]: string
}

type NoteDurations = "w" | "h" | "q" | "8" | "16";

type SimpleNoteObj = Pick<NoteObj, "key" | "octave">;
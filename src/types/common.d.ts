
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

type SavedMelody =  { "notes": NoteObj[][], "date": string };

type TabsForInstruments = "guitar" | "violin" | "piano";

type InstrumentTuning = { [key: string]: string };

type ValidateRule = { min: number, max: number, default: number, vRef: Ref<number> };

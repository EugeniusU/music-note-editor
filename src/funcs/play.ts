import { DURATION_MAP } from "@/constants/common";
import * as Tone from "tone";
import type { StaveNote } from "vexflow";

async function play2(infiniteNotes: StaveNote[]) {
    await Tone.start();
    Tone.getTransport().bpm.value = 120;

    let currentTimePosition = 0;

    const synth = new Tone.PolySynth().toDestination();

    await Tone.loaded();

    const now = Tone.now();

    const fNotes = infiniteNotes.map(note => {
        if (note.isRest()) {
            const d = note.getDuration();

            return [{ type: 'rest', duration: d }];
        }

        const keyProps = note.getKeyProps();

        const f = keyProps.map(p => {
            const k = p.key;
            const o = p.octave;
            const d = note.getDuration();
            const a = '';

            return {
                key: k,
                octave: o,
                duration: d,
                accidental: a,
            };
        })

        return f;
    });

    fNotes.forEach((notes, i) => {
        const note = notes[0]!;

        const toneDuration = DURATION_MAP[note.duration.toString() as NoteDurations];
        const durationInSeconds = Tone.Time(toneDuration).toSeconds();
       
        if (note.type && note.type === 'rest') {
            // skip
        } else {
            const f = notes.map(n => n.key + n.accidental + n.octave);

            synth.triggerAttackRelease(f, toneDuration, `+${currentTimePosition}`);
        }

        Tone.Draw.schedule(() => {
            const noteEl = document.querySelector(`[data-id="vf-note-${i}"]`);
            const tabEl = document.querySelector(`[data-id="vf-tab-${i}"]`);

            if (noteEl) {
                noteEl.classList.add('note-highlighted');
            }

            if (tabEl) {
                tabEl.classList.add('note-highlighted');
            }

            setTimeout(() => {
                if (noteEl) {
                    noteEl.classList.remove('note-highlighted');
                }

                if (tabEl) {
                    tabEl.classList.remove('note-highlighted');
                }
            }, durationInSeconds * 1000);

        }, `+${currentTimePosition}`);

        currentTimePosition += durationInSeconds;
    });

}

export { play2 }

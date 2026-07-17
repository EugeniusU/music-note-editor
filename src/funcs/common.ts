import { NOTE_KEYS, PIANO_OCTAVES } from "@/constants/common";
import { StaveNote, VexFlow, Factory, type KeyProps } from "vexflow";
import type { Reactive, Ref } from "vue";

function getGuitarFretsFromNote(note: string, noteKeys: typeof NOTE_KEYS, guitarTuning: GuitarTuning, maxFret = 24) {
    const guitarNotesMap = getGuitarNotesMap(noteKeys, guitarTuning, maxFret);
    const stringsWithFretsMap: { [stringIndex: string]: number } = {};

    Object.entries(guitarNotesMap).forEach(pair => {
        const [s, notes] = pair;
        const fretIndex = notes.indexOf(note);

        if (fretIndex > -1) {
            stringsWithFretsMap[s] = fretIndex;
        }
    });

    return stringsWithFretsMap;
}

function getGuitarNotesMap(noteKeys: typeof NOTE_KEYS, guitarTuning: GuitarTuning, maxFret = 24) {
    const map: { [key: string]: string[] } = {};
    const allPianoNotes = getPianoNotes(noteKeys, 'C', PIANO_OCTAVES);

    Object.entries(guitarTuning).forEach(pair => {
        const string = pair[0];
        const openStringNote = pair[1];

        const index = allPianoNotes.indexOf(openStringNote);
        map[string] = [openStringNote];

        for (let j = 1; j <= maxFret; j++) {
            const nextNoteIndex = index + j;

            if (nextNoteIndex >= allPianoNotes.length) {
                break;
            }

            const nextNote = allPianoNotes[nextNoteIndex] || "";

            if (!nextNote.length) {
                console.warn("Not found note for", "index", nextNote);
            }

            map[string].push(nextNote);
        }
    });

    return map;
}

function getPianoNotes(noteKeys: typeof NOTE_KEYS, start = 'C', octaves = 5) {
    const allPianoNotes = [];

    for (let i = 1; i <= octaves; i++) {
        if (i == 1) {
            allPianoNotes.push(...noteKeys);
            continue;
        }

        noteKeys.forEach(key => {
            const note = key + i;
            allPianoNotes.push(note);
        });
    }

    return allPianoNotes;
}

function saveData(notes: StaveNote[]) {
    const fNotes: NoteObj[][] = notes.map(note => {
        const keyProps = note.getKeyProps();
        const duration = note.getDuration() as NoteDurations;

        const f = keyProps.map(f => {
            return { key: f.key, octave: f.octave, duration: duration, isSharp: f.key.includes("#") };
        });

        return f;
    });

    const key = 'notes_saved';

    const data = [];

    const prev = localStorage.getItem(key);

    if (prev) {
        const a = JSON.parse(prev);

        data.push(...a);
    }

    data.push({ date: new Date().toString(), notes: fNotes });

    localStorage.setItem(key, JSON.stringify(data));
}

function loadData(factory: Factory, guitarTune: GuitarTuning) {
    const key = 'notes_saved';

    const data = localStorage.getItem(key);

    if (data) {
        const a = JSON.parse(data);

        const notes = a[a.length - 1].notes as NoteObj[][];

        function f(noteObj2: NoteObj[]) {
            const keys = noteObj2.map(noteObj => {
                const note = noteObj.key;
                const octave = noteObj.octave;
                const noteKey = note + '/' + octave;

                return noteKey;
            });


            const f0 = noteObj2[0]!;

            const duration = f0.duration;
            const note = f0.key;
            const sign = note.includes('#');

            const n1 = factory.StaveNote({ keys: [...keys], duration: duration});

            if (sign) {
                n1.addModifier(factory.Accidental({ type: '#' }));
            }

            return n1;
        }

        const fNotes = notes.map(f);

        return { notes: fNotes };
    }
}

function getNoteIndexFromEl(el: Element) {
    const s = el.getAttribute("data-id");

    if (s) {
        const a = s.split("-");
        const n = a[a.length - 1];

        return Number(n);
    }

    return -1;
}

function replaceNotes(notes: StaveNote[], replaced: { index: number; note: StaveNote }[]) {
    const copy = notes.map(n => n);

    replaced.forEach(obj => {
        const i = obj.index;
        const n = obj.note;

        copy[i] = n;
    });

    return copy;
}

function noteObjFromNote(note: StaveNote): NoteObj {
    const keyProps = note.getKeyProps();

    const key = keyProps[0]!.key;
    const octave = keyProps[0]!.octave;
    const duration = note.getDuration() as NoteDurations;


    const obj: NoteObj = { key: key, octave: octave, duration: duration, isSharp: key.includes("#")  };

    return obj;
}

function noteObjFromNote2(note: StaveNote): NoteObj[] {
    const keyProps = note.getKeyProps();

    const f = keyProps.map(p => {
        return { key: p.key, octave: p.octave, duration: note.getDuration() as NoteDurations, isSharp: p.key.includes("#") };
    });

    return f;
}

function f2_makeTab2(noteObjs: NoteObj[], guitarTune: GuitarTuning) {
    const usedStrings: string[] = [];

    const f2 = noteObjs.map(noteObj => {
        const note = noteObj.key;
        const octave = noteObj.octave;
        
        const testFretsMap = getGuitarFretsFromNote(note + octave, NOTE_KEYS, guitarTune, 24);

        const fk = Object.keys(testFretsMap)[0]!;

        if (usedStrings.includes(fk)) {
            const fk2 = Object.keys(testFretsMap).find(s => !usedStrings.includes(s));

            if (fk2) {
                usedStrings.push(fk2);

                const f = testFretsMap[fk2]!;

                return { str: +fk2, fret: f };
            } else {
                console.warn("can not find string");
                console.warn(testFretsMap);
            }
        }

        usedStrings.push(fk);

        const f = testFretsMap[fk]!;

        return { str: +fk, fret: f };
    });        

    const duration = noteObjs[0]!.duration;
    const n2 = new VexFlow.TabNote({ positions: [...f2], duration: duration }).setFont('Arial', 14, 'bold');

    return n2;
}

function isHTMLNode(n: Node): n is HTMLElement {
  return n instanceof HTMLElement;
}

function isSVGNode(n: Node): n is SVGElement {
  return n instanceof SVGElement;
}

function isElementNode(n: Node): n is Element {
  return n instanceof Element;
}

function isFactory(f: unknown): f is Factory {
  return f instanceof Factory;
}

function makeCMajor(octave = 1, duration = 'q' as NoteDurations): NoteObj[] {
    const keys = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

    const keys2 = [...keys, ...keys.reverse()];

    const notes: NoteObj[] = keys2.map(k => ({ key: k, octave: octave, duration: duration, isSharp: false }));

    return notes;
}

function guitarToPianoRange(guitarFrets: { [key: string]: string[] }, pianoKeys: string[]) {
    const gStrings = Object.keys(guitarFrets);
    const gHighString = gStrings.reduce((a, b) => a < b ? a : b);
    const gLowString = gStrings.reduce((a, b) => a > b ? a : b);

    const gMinKey = guitarFrets[gLowString]![0]!;
    const gMaxKey = guitarFrets[gHighString]!.at(-1)!;

    const minIdx = pianoKeys.findIndex(k => k === gMinKey);
    const maxIdx = pianoKeys.findIndex(k => k === gMaxKey);

    return { min: { key: gMinKey, index: minIdx }, max: { key: gMaxKey, index: maxIdx } };
}

function transpose(note: string, index: number) {
    const allPianoNotes = getPianoNotes(NOTE_KEYS, 'C', PIANO_OCTAVES);
    const idx = allPianoNotes.indexOf(note);

    if (idx > -1) {
        const idx2 = idx + index;
        const note2 = allPianoNotes[idx2];

        if (note2) {
            if (!isNaN(Number(note2.at(-1)))) {
                const tmp = note2.split("");
                tmp.splice(tmp.length - 1, 0, "/")
                
                return tmp.join("");
            }

            return note2;
        }
        
    }

    return null;
}

export { getGuitarFretsFromNote, getGuitarNotesMap, getPianoNotes, loadData, saveData, getNoteIndexFromEl, replaceNotes, noteObjFromNote, f2_makeTab2, noteObjFromNote2, isSVGNode, makeCMajor, guitarToPianoRange, transpose }

<template>
    <div class='piano'>
        <div 
            v-for="(note, i) in pianoKeys"
            :key="i"
            :class="[note.isSharp ? 'sharp' : '', colorizeCurrentApplied(note), colorizeSelectedNote(note)]"
            @click="handleClickPianoKey(note, i)"
            :style="isOverBounds(i) ? 'background: lightgrey' : ''"
        >{{ note.key + note.octave }}</div>
    </div>
</template>

<script setup lang="ts">
import { GUITAR_TUNE, NOTE_KEYS, VIOLIN_TUNE } from '@/constants/common';
import { getGuitarNotesMap, getPianoNotes, guitarToPianoRange } from '@/funcs/common';
import { computed, ref, watch } from 'vue';

const props = withDefaults(defineProps<{
    noteDuration?: NoteDurations;
    octaves?: number;
    selectedNote?: SimpleNoteObj[] | null;
    selectedInstrument?: TabsForInstruments;
}>(), {
    noteDuration: "q",
    octaves: 5,
    selectedNote: null,
    selectedInstrument: "piano",
});

const emit = defineEmits<{
    touchNoteKey: [note: NoteObj]
}>();

const OCTAVES = props.octaves;

const pianoKeys = computed<NoteObj[]>(() => {
    const notes: NoteObj[] = [];

    for (let i = 1; i <= OCTAVES; i++) {
        NOTE_KEYS.forEach((key, j) => {
            const note: NoteObj = { key: key, octave: i, isSharp: key.includes("#"), duration: props.noteDuration };
            notes.push(note);
        })
    }

    return notes;
});

const currentApplied = ref<NoteObj[]>([]);

function handleClickPianoKey(noteObj: NoteObj, index: number) {
    if (isOverBounds(index)) {
        console.warn("disabled");
        return null;
    }

    emit("touchNoteKey", noteObj);

    currentApplied.value.push(noteObj);

    setTimeout(() => {
        const idx = currentApplied.value.findIndex(v => v.key === noteObj.key && v.octave === noteObj.octave);

        if (idx !== -1) {
            currentApplied.value.splice(idx, 1);
        }
    }, 1000);
}

function colorizeCurrentApplied(n: NoteObj) {
    if (currentApplied.value.some(v => v.key === n.key && v.octave === n.octave)) {
        return "currentApplied";
    }

    return "";
}

function colorizeSelectedNote(n: NoteObj) {
    if (props.selectedNote) {
        if (props.selectedNote.some(v => v.key === n.key && v.octave === n.octave)) {
            return "currentApplied";
        }
    }

    return "";
}

const rangeRef = computed(() => guitarToPianoRange(getGuitarNotesMap(NOTE_KEYS, props.selectedInstrument === "violin" ? VIOLIN_TUNE : GUITAR_TUNE, 24), getPianoNotes(NOTE_KEYS, "C", props.octaves)));

function isOverBounds(index: number) {
    if (props.selectedInstrument === "piano") {
        return false;
    }

    const range = rangeRef.value;

    if (index < range.min.index || index > range.max.index) {
        return true;
    }

    return false;
}

</script>


<style>
.piano {
    display: flex;
}

.piano div {
    width: 50px;
    height: 150px;
    border: 1px solid;
}

.piano .sharp {
    background: grey;
    color: white;
}

.piano div:hover {
    background-color: lightgreen;
}

.currentApplied {
    /* background-color: purple; */
    box-shadow: 1px 1px 15px purple;
}
</style>
<template>
    <div class='piano'>
        <div 
            v-for="(note, i) in pianoKeys"
            :key="i"
            :class="note.isSharp ? 'sharp' : ''"
            @click="handleClickPianoKey(note, i)"
            :style="isOverBounds(i) ? 'background: lightgrey' : ''"
        >{{ note.key + note.octave }}</div>
    </div>
</template>

<script setup lang="ts">
import { GUITAR_TUNE, NOTE_KEYS } from '@/constants/common';
import { getGuitarNotesMap, getPianoNotes, guitarToPianoRange } from '@/funcs/common';
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    noteDuration?: NoteDurations;
    octaves?: number;
}>(), {
    noteDuration: "q",
    octaves: 5,
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

function handleClickPianoKey(noteObj: NoteObj, index: number) {
    if (isOverBounds(index)) {
        console.warn("disabled");
        return null;
    }

    emit("touchNoteKey", noteObj);
}

const range = guitarToPianoRange(getGuitarNotesMap(NOTE_KEYS, GUITAR_TUNE, 24), getPianoNotes(NOTE_KEYS, "C", props.octaves));

function isOverBounds(index: number) {
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
</style>
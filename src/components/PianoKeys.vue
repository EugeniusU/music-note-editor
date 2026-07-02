<template>
    <div class='piano'>
        <div 
            v-for="(note, i) in pianoKeys"
            :key="i"
            :class="note.isSharp ? 'sharp' : ''"
            @click="handleClickPianoKey(note)"
        >{{ note.key + note.octave }}</div>
    </div>
</template>

<script setup lang="ts">
import { NOTE_KEYS } from '@/constants/common';
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

function handleClickPianoKey(noteObj: NoteObj) {
    emit("touchNoteKey", noteObj);
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
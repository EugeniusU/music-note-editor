<template>
    <div class='guitar'>
        <div 
            v-for="(string, i) in GUITAR_TUNE"
            :key="i"   
            
        >

            <div class="guitar_string" :string="i" :openStringNote="string" >
                <div class="guitar_string_open" @click="handleClickGuitarKey(0, i)" :class="currentSelectedFret !== null && currentSelectedFret[i] === 0 ? 'currentApplied' : ''" >
                    {{ string }}
                </div>

                <div class="guitar_string_line"></div>

                <div 
                    v-for="(fret, j) in MAX_FRET"
                    :key="j"
                    class="guitar_fret"
                    @click="handleClickGuitarKey(fret, i)"
                    
                    @mouseenter="showNoteFromFretMap(true, i, fret)"
                    @mouseleave="showNoteFromFretMap(false, i, fret)"
                    
                   :class="currentSelectedFret !== null && currentSelectedFret[i] === fret ? 'currentApplied' : ''" 
                >
                    {{ isShowNoteFromFretHintMap[i]?.[fret] ? getNoteFromGuitarFret(fret, i) : "" }}
                    <span v-if="i === '1'">{{ fret }}</span>
                </div>   
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { GUITAR_TUNE, NOTE_KEYS, PIANO_OCTAVES } from '@/constants/common';
import { getGuitarFretsFromNote, getPianoNotes } from '@/funcs/common';
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{
    noteDuration?: NoteDurations;
    selectedNote?: SimpleNoteObj[] | null;
}>(), {
    noteDuration: "q",
    selectedNote: null,
});

const MAX_FRET = 24;

const isShowNoteFromFretHint = ref(false);
const isShowNoteFromFretHintMap = ref<{[stringNum: string]: { [fretNum: string]: boolean }}>({});

const emit = defineEmits<{
    touchFretKey: [note: NoteObj]
}>();

const currentApplied = ref("");

function handleClickGuitarKey(fret: number, string: keyof typeof GUITAR_TUNE) {
    const noteKey = getNoteFromGuitarFret(fret, string);
    const octave = noteKey.split("").find(s => !isNaN(Number(s))) || 1;
    const key = noteKey.split("").filter(s => isNaN(Number(s))).join("");

    emit("touchFretKey", { key: key, octave: Number(octave), isSharp: noteKey.includes("#"), duration: props.noteDuration });

    currentApplied.value =  string + "_" + fret;

    setTimeout(() => {
        currentApplied.value = "";
    }, 1000);
}

function showNoteFromFret(f: boolean) {
    isShowNoteFromFretHint.value = f;
}

function showNoteFromFretMap(f: boolean, stringNum: string, fretNum: number) {
    isShowNoteFromFretHintMap.value[stringNum] = { [fretNum]: f };
}

function getNoteFromGuitarFret(fret: number, string: keyof typeof GUITAR_TUNE) {
    const openStringNote = GUITAR_TUNE[string];
    const pianoNotes = getPianoNotes(NOTE_KEYS, "C", PIANO_OCTAVES);

    const fOpenIdx = pianoNotes.findIndex(k => k === openStringNote);

    const fNote = pianoNotes[fOpenIdx + fret];


    return fNote || "";
}

const currentSelected = computed(() => props.selectedNote);

const currentSelectedFret = computed(() => {
    if (props.selectedNote) {
        const obj: { [s: string]: number } = {};

        props.selectedNote.forEach(n => {
            const key = n.key;
            const octave = n.octave;

            const f = getGuitarFretsFromNote(key + octave, NOTE_KEYS, GUITAR_TUNE);

            const ks = Object.keys(f);

            const k = ks.find(k1 => !(k1 in obj));

            if (k) {
                const v = f[k] as number;

                obj[k] = v;
            }
        })

        return obj;
    }

    return null;
})

</script>
<style>
.guitar .guitar_string {
    display: flex;
    margin-top: 15px;
}

.guitar_string .guitar_fret {
    min-width: 70px;
    border-right: 1px solid purple;
    text-align: center;

    min-height: 35px;
    top: -10px;
    position: relative;
}

.guitar_string .guitar_fret:hover {
    background-color: lightgreen;
}

.guitar_string_line {
    position: absolute;
    width: 100%;
    height: 3px;
    background: green;
    margin-top: 10px;
}

.guitar_string_open {
    min-width: 50px;
    border-right: 1px solid deeppink;
    position: relative;
    top: -10px;
    min-height: 35px;
}

.guitar_string_open:hover {
    background-color: lightgreen;
}

.guitar_fret span {
    position: relative;
    top: -10px;
}

.colorized_fret {
    background: pink;
}

.currentApplied {
    background-color: purple;
}

</style>
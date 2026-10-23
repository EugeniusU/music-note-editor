<template>
    <div class='controls'>
        <button id='play' @click="play()" v-colorize>Play</button>
        <button id='stop'>Stop</button>
        <button id='reset'>Reset</button>
        <button id='save' @click="save()" v-colorize>Save</button>
        <button id='load' @click="load()" v-colorize>Load</button>
        <button id='testSelection' @click="selection()" :style="{ backgroundColor: isSelection ? 'lightgreen' : '' }">testSelection</button>
        <button @click="selectAllNotes()" v-colorize>Select all notes</button>
        <button @click="resetSelection()" v-colorize>Reset selection</button>

        <label for='isShowGuitar'>Show guitar?</label>
        <input type='checkbox' name='isShowGuitar' id="isShowGuitar" v-model="isShowGuitarRef">

        <label for='isShowViolin'>Show violin?</label>
        <input type='checkbox' name='isShowViolin' id="isShowViolin" v-model="isShowViolinRef">

        <span>Select tabs for instrument</span>
        <select :value="props.tabsForInstrument" @change="handleSelectEvent" v-colorize>
            <option value="guitar">Guitar</option>
            <option value="violin">Violin</option>
            <option value="piano">Piano</option>
        </select>

        <label>Note Duration</label>
        <select v-model="noteDuration" @change="changeNoteDuration" v-colorize>
            <option value="w">1</option>
            <option value="h">1/2</option>
            <option value="q">1/4</option>
            <option value="8">1/8</option>
            <option value="16">1/16</option>
        </select>

        <button id='pause'>Pause</button>

        <label>Transpose</label>
        <input type='number' min='-24' max='24' step='1' v-model="transposeInputValue" @change="e => validateNumberValue(e, transposeRule)">
        <button id='transposeButton' @click="makeTranspose" v-colorize>make</button>

        <label>Apply changes</label>
        <button id='apply' @click="apply()" v-colorize>Apply</button>

        <button @click="clearAllNotes()" v-colorize>Clear all notes</button>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { validateNumberValue } from '@/funcs/common';

const emit = defineEmits<{
    play: [];
    save: [];
    load: [];
    duration: [v: NoteDurations]
    apply: [];
    selection: [];
    switchShowGuitar: [];
    switchShowViolin: [];
    switchTabsForInstrument: [v: TabsForInstruments];
    transpose: [v: number];
    clearAllNotes: [];
    selectAllNotes: [];
    resetSelection: [];
}>();

const props = withDefaults(defineProps<{
    isSelection: boolean;
    isShowGuitar: boolean;
    isShowViolin: boolean;
    tabsForInstrument: TabsForInstruments;
}>(), {
    isSelection: false,
    isShowGuitar: true,
    isShowViolin: false,
    tabsForInstrument: "guitar",
});

const noteDuration = ref<NoteDurations>("q");
const isShowGuitarRef = ref(props.isShowGuitar);
const isShowViolinRef = ref(props.isShowViolin);
const transposeInputValue = ref(1);
const transposeRule: ValidateRule = { min: -24, max: 24, default: 1, vRef: transposeInputValue };
const tabsForInstrumentRef = ref<TabsForInstruments>(props.tabsForInstrument);

watch(isShowGuitarRef, () => {
    switchShowGuitar();
});

watch(isShowViolinRef, () => {
    switchShowViolin();
})

function play() {
    emit("play");
}

function save() {
    emit("save");
}

function load() {
    emit("load");
}

function changeNoteDuration() {
    emit("duration", noteDuration.value);
}

function apply() {
    emit("apply");
}

function selection() {
    emit("selection")
}

function switchShowGuitar() {
    emit("switchShowGuitar");
}

function switchShowViolin() {
    emit("switchShowViolin");
}

function switchTabsForInstrument(v: TabsForInstruments) {
    emit("switchTabsForInstrument", v);
}

function makeTranspose() {
    emit("transpose", transposeInputValue.value);
}

function clearAllNotes() {
    emit("clearAllNotes");
}

function selectAllNotes() {
    emit("selectAllNotes");
}

function resetSelection() {
    emit("resetSelection");
}

function handleSelectEvent(e: Event) {
    const v = (e.target as HTMLSelectElement).value;

    switchTabsForInstrument(v as TabsForInstruments);
}
</script>
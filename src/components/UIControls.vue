<template>
    <div class='controls'>
        <button id='play' @click="play()">Play</button>
        <button id='stop'>Stop</button>
        <button id='reset'>Reset</button>
        <button id='save' @click="save()">Save</button>
        <button id='load' @click="load()">Load</button>
        <button id='testSelection'>testSelection</button>

        <label id='isShowGuitar'>Show guitar?</label>
        <input type='checkbox' for='isShowGuitar' id='isShowGuitarInput' checked="true">

        <label>Note Duration</label>
        <select v-model="noteDuration" @change="changeNoteDuration">
            <option value="w">1</option>
            <option value="h">1/2</option>
            <option value="q">1/4</option>
            <option value="8">1/8</option>
            <option value="16">1/16</option>
        </select>

        <button id='pause'>Pause</button>

        <label>Transpose</label>
        <input type='number' min='-24' max='24' step='1' value='1' id='transposeInput'>
        <button id='transposeButton'>make</button>

        <label>Apply changes</label>
        <button id='apply' @click="apply()">Apply</button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
    play: [];
    save: [];
    load: [];
    duration: [v: NoteDurations]
    apply: [];
}>();

const noteDuration = ref<NoteDurations>("q");

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

</script>
<template>
    <div class="list">
        <div class="list_header">
            <span class="text-key">Saved melodies</span>
        </div>

        <div 
            v-for="(item, i) in items"
            :key="i"
            class="node"
            @click="handleClick(item)"
        >
            <span class="text-key">date:</span>
            <span>{{ item.date }},</span> 
            <span class="text-key">length: </span>
            <span>{{ item.notes.length }}</span>
        </div>

        <button title="Close" class="close_button" @click="handleClose">X</button>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const emit = defineEmits<{
    selectItem: [SavedMelody];
    closeList: [];
}>();

const items = ref<SavedMelody[]>([]);

function handleClick(node: SavedMelody) {
    emit("selectItem", node);

    handleClose();
}

function handleClose() {
    emit("closeList");
}

onMounted(() => {
    const key = 'notes_saved';
    const data = localStorage.getItem(key);


    if (data) {
        try {
            const v = JSON.parse(data);
            items.value = v;
        } catch (e) {
            console.error(e);
            alert("Error with json parsing");
        }
    }
})

</script>

<style>
.list {
    font-size: 16px;
    border-color: purple;
    border: 2px solid springgreen;
    position: fixed;
    background-color: white;
    top: 10%;
    left: 35%;
    padding: 5px;
}

.node {
    color: green;
    background-color: greenyellow;
    border-color: lightgreen;
    border: 1px solid;
    padding: 3px;
    margin-top: 5px;

}

.node:hover {
    background-color: forestgreen;
    color: antiquewhite;
}

.text-key {
    font-weight: bold;
}


.list_header {
    display: flex;
    margin-bottom: 10px;
}

.close_button {
    position: absolute;
    top: 5px;
    right: 5px;
}
</style>

<template>
  <div>
    <UIControls @play="handlePlay" @save="handleSave" @load="handleLoad" @duration="handleNoteDuration" @apply="handleApply" />

    <PianoKeys @touch-note-key="handleTouchNote" :octaves="5" />
    <GuitarKeys @touch-fret-key="handleTouchNote" :note-duration="currentDuration" :selected-note="firstSelectedNoteKey"  />

    <div id="output"></div>
  </div>
</template>

<script setup lang="ts">
import VexFlow, { Factory, StaveNote, TabNote } from 'vexflow';
import PianoKeys from './components/PianoKeys.vue';
import { computed, onMounted, ref, shallowReactive, toValue, watch } from 'vue';
import { f2_makeTab2, getNoteIndexFromEl, isSVGNode, loadData, noteObjFromNote, noteObjFromNote2, replaceNotes, saveData } from './funcs/common';
import { GUITAR_TUNE } from './constants/common';
import { renderInfinityProgression } from './funcs/rendering';
import UIControls from './components/UIControls.vue';
import { play2 } from './funcs/play';
import GuitarKeys from './components/GuitarKeys.vue';


const infiniteNotes = shallowReactive<StaveNote[]>([]);
const infiniteTabNotes = shallowReactive<TabNote[]>([]);

const currentDuration = ref<NoteDurations>("q");

let factoryInit : Factory | null = null;

function makeStaveNote(keys: string[], duration: string): StaveNote {
    const factory = factoryInit!;

    const n1 = factory.StaveNote({ keys: [...keys], duration: duration });

    const sharpNotes = keys.map(k => k.includes("#"));

    sharpNotes.forEach((f, i) => {
      if (f) {
        n1.addModifier(factory.Accidental({ type: '#' }), i);
      }
    })

    return n1;
}

function noteObjToStaveNote(note: NoteObj): StaveNote {
    const noteKey = note.key + "/" + note.octave;
    const duration = note.duration;

    return makeStaveNote([noteKey], duration);
}

function handleTouchNote(note: NoteObj) {
  if (currentSelectedNoteEls.value.length) {
    const changedNoteIdx = currentSelectedNoteIdx[0]!;
    const existNote = infiniteNotes[changedNoteIdx]!;
    const existKeyProps = existNote.getKeyProps();
    
    const f = existKeyProps.find(p => p.key === note.key && p.octave === note.octave);

    if (f !== undefined) {
      // make pause

      if (existKeyProps.length === 1) {
        const d = currentDuration.value;
        const n1 = makeStaveNote(['b/4'], d + 'r');
        infiniteNotes.splice(changedNoteIdx, 1, n1);
      } else {
        const existIdx = existKeyProps.findIndex(p => p.key === note.key && p.octave === note.octave);
        const existKeys = existNote.getKeys();
        const newKeys = existKeys.filter((k, i) => i !== existIdx);

        const n1 = makeStaveNote([...newKeys], currentDuration.value);
        infiniteNotes.splice(changedNoteIdx, 1, n1);
      }
      
    } else {
      const duration = note.duration;
      const existKeys = existNote.getKeys();
      const noteKey = note.key + "/" + note.octave;

      const n1 = makeStaveNote([...existKeys, noteKey], duration);
      infiniteNotes.splice(changedNoteIdx, 1, n1);
    }

  } else {
    const n1 = noteObjToStaveNote(note);
    infiniteNotes.push(n1);
  }
}

const isRenderingUpdates = ref(false);

watch(infiniteNotes, async () => {
  const infiniteNotesCopy = toValue(infiniteNotes);
  infiniteTabNotes.splice(0, infiniteTabNotes.length);

  const tabs = infiniteNotesCopy.map(n => {
    if (n.isRest()) {
      const d = n.getDuration();
      const n2 = new VexFlow.TabNote({ positions: [{ str: 1, fret: 'r' }], duration: d + 'r' }).setFont('Arial', 14, 'bold');

      return n2;
    } 
    
    return f2_makeTab2(noteObjFromNote2(n), GUITAR_TUNE);
  });

  infiniteTabNotes.push(...tabs);
  const infiniteTabNotesCopy = toValue(infiniteTabNotes);

  renderInfinityProgression('output', infiniteNotesCopy, infiniteTabNotesCopy, 800);

  isRenderingUpdates.value = true;
});

const noteEls = computed(() => {
  if (isRenderingUpdates.value) {
    isRenderingUpdates.value = false;

    const f = infiniteNotes.map(note => note.getSVGElement());
    const f2 = f.filter(el => el !== undefined);

    return f2;
  }

  const f = infiniteNotes.map(note => note.getSVGElement());
  const f2 = f.filter(el => el !== undefined);

  return f2;
});


const currentSelectedNoteIdx = shallowReactive<number[]>([]);

const currentSelectedNoteEls = computed<Node[]>(() => {
    return currentSelectedNoteIdx.map(i => noteEls.value[i]).filter(n => n !== undefined);
});

const firstSelectedNoteKey = computed<SimpleNoteObj[] | null>(() => {
  const idx = currentSelectedNoteIdx[0];

  if (idx !== undefined) {
    const obj = infiniteNotes[idx];

    if (obj !== undefined) {
      if (obj.isRest()) {
        return null;
      }

      const ps = obj.getKeyProps();
      const f = ps.map(p => ({ key: p.key, octave: p.octave }));

      return f;
    }
  }

  return null;
})

watch(noteEls, () => {
  noteEls.value.forEach(n => {
    n.addEventListener("click", _event => {
      const idx = getNoteIndexFromEl(n);

      if (!currentSelectedNoteIdx.includes(idx)) {
        currentSelectedNoteIdx.push(idx);
      } else {
        const i = currentSelectedNoteIdx.indexOf(idx);
        currentSelectedNoteIdx.splice(i, 1);
      }

    })
  })
})

watch(currentSelectedNoteEls, (now, pre) => {
  if (pre.length) {
    pre.forEach(n => {
      if (n && isSVGNode(n)) {
          n.classList.remove("selected_note");
      }
    })
  }

  if (now.length) {
    now.forEach(n => {
      if (n && isSVGNode(n)) {
          n.classList.add("selected_note");
      }
    })
  }

})

onMounted(() => {
  factoryInit = new VexFlow.Factory({ renderer: { elementId: 'output', width: 500, height: 200 }});
});

function handlePlay() {
  /// play(toValue(infiniteNotes))
  play2(toValue(infiniteNotes));
}

function handleSave() {
  saveData(toValue(infiniteNotes));
}

function handleLoad() {
  if (factoryInit !== null) {
    const obj = loadData(factoryInit, GUITAR_TUNE);

    if (obj) {
      infiniteNotes.push(...obj.notes);
    }
  } else {
    console.error("Factory init is null");
  }
}

function handleNoteDuration(v: NoteDurations) {
  currentDuration.value = v;
}

function handleApply() {
  const idx = currentSelectedNoteIdx;
  const noteObjs = idx.map(i => ({ index: i, note: infiniteNotes[i]})).filter((n) : n is { index: number; note: StaveNote } => n.note !== undefined);

  if (noteObjs.length !== idx.length) {
    console.error("Can not find some notes by index");
  }

  const noteObjs2 = noteObjs.map(n => ({ index: n.index, note: noteObjFromNote(n.note) }));
  const changeNoteDuration = noteObjs2.map(n => ({ index: n.index, note: {...n.note, duration: currentDuration.value } }));
  const fNotes = changeNoteDuration.map(n => ({ index: n.index, note: noteObjToStaveNote(n.note) }))

  const newNotes = replaceNotes(toValue(infiniteNotes), fNotes);

  infiniteNotes.splice(0, infiniteNotes.length);
  infiniteNotes.push(...newNotes);
}

</script>

<style>
svg .vf-tabnote {
    font-family: "Arial", "Helvetica", sans-serif !important;
    font-size: 14px !important;
    font-weight: bold !important;

    transform: translateX(16px);
}

#output {
    margin-top: 100px;
}

.guitar .guitar_string {
    display: flex;
    margin-top: 15px;
}

.guitar_string .guitar_fret {
    min-width: 70px;
    border-right: 1px solid purple;
    text-align: center;
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
}

.guitar_fret span {
    position: relative;
    top: -10px;
}

.colorized_fret {
    background: pink;
}

.note-highlighted {
    fill: #ff6b00 !important;
    stroke: #ff6b00 !important;
    transition: fill 0.1s ease, stroke 0.1s ease;
}

.colorized_note {
    background: pink;
}

.selected_note {
  fill: lightgreen;
  stroke: lightgreen;
}
</style>

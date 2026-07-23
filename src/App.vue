<template>
  <div>
    <UIControls 
      @play="handlePlay" 
      @save="handleSave" 
      @load="handleLoad" 
      @duration="handleNoteDuration" 
      @apply="handleApply" 
      @selection="handleSelection" 
      :is-selection="isSelection" 
      :is-show-guitar="isShowGuitar"
      @switch-show-guitar="handleShowGuitar"
      @transpose="handleTranspose"
      @clear-all-notes="handleClearAllNotes"
      @select-all-notes="handleSelectAllNotes"
      @reset-selection="handleResetSelection"
    />

    <button @click="handleTest()">Test</button>
    <button @click="findOptimalTabs()">Test optimal tabs</button>

    <PianoKeys @touch-note-key="handleTouchNote" :octaves="PIANO_OCTAVES" />
    <GuitarKeys @touch-fret-key="handleTouchNote" :note-duration="currentDuration" :selected-note="firstSelectedNoteKey" v-show="isShowGuitar"  />

    <div id="output" ref="outputRef"></div>

    <LoadSaved v-if="isShowList" @select-item="handleSelected" @close-list="handleCloseList" />


  </div>
</template>

<script setup lang="ts">
import VexFlow, { Factory, StaveNote, TabNote, type TabNotePosition } from 'vexflow';
import PianoKeys from './components/PianoKeys.vue';
import { computed, onMounted, ref, shallowReactive, toValue, useTemplateRef, watch } from 'vue';
import { f2_makeTab2, getGuitarFretsFromNote, getGuitarNotesMap, getNoteIndexFromEl, getPianoNotes, guitarToPianoRange, isSafeTransposing, isSVGNode, loadData, makeCMajor, noteObjFromNote, noteObjFromNote2, replaceNotes, saveData, transpose, transpose2 } from './funcs/common';
import { GUITAR_TUNE, NOTE_KEYS, PIANO_OCTAVES } from './constants/common';
import { renderInfinityProgression } from './funcs/rendering';
import UIControls from './components/UIControls.vue';
import { play2 } from './funcs/play';
import GuitarKeys from './components/GuitarKeys.vue';
import LoadSaved from './components/LoadSaved.vue';


const infiniteNotes = shallowReactive<StaveNote[]>([]);
const infiniteTabNotes = shallowReactive<TabNote[]>([]);

const currentDuration = ref<NoteDurations>("q");

const isShowList = ref(false);
const isSelection = ref(false);
const isShowGuitar = ref(true);
const outputRef = useTemplateRef('outputRef');

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
    const noteKey = makeStaveKeyFromNoteObj(note);
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
      const noteKey = makeStaveKeyFromNoteObj(note);

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

function findNode(node: Element, selector: string): Element | null {
  let finded: Element | null = null;

  for (let n = node; n.parentElement !== null; n = n.parentElement) {
    if (n.classList.contains(selector)) {
      finded = n;
      break;
    }
  }

  return finded;
}

function applySelectionEvent(event: Event) {
  if (event.target) {
        const f = findNode(event.target as Element, "vf-stavenote");

        if (f) {
          const noteIdx = getNoteIndexFromEl(f);

          if (!currentSelectedNoteIdx.includes(noteIdx)) {
            currentSelectedNoteIdx.push(noteIdx);
          } else {
            const existIdx = currentSelectedNoteIdx.findIndex(i => i === noteIdx);

            currentSelectedNoteIdx.splice(existIdx, 1);
          }
        }
      }
}

watch(isSelection, () => {
  if (outputRef.value) {
    if (isSelection.value) {
      outputRef.value.addEventListener("mouseover", applySelectionEvent);
    } else {
      outputRef.value.removeEventListener("mouseover", applySelectionEvent);

      resetSelection();
    }
  }
});

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
  isShowList.value = true;
}

function handleCloseList() {
  isShowList.value = false;
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

function handleSelected(v: SavedMelody) {
  const v2 = v.notes.map(a => {
    const noteKeys = a.map(makeStaveKeyFromNoteObj);
    const duration = a[0]!.duration;

    return makeStaveNote(noteKeys, duration);
  });

  infiniteNotes.push(...v2);
}

function handleSelection() {
  isSelection.value = !isSelection.value;
}

function handleShowGuitar() {
  isShowGuitar.value = !isShowGuitar.value;
}

function makeStaveKeyFromNoteObj(n: NoteObj): string {
  return n.key + "/" + n.octave;
}

function handleTest() {
  const notes = makeCMajor(4);

  const noteKeys = notes.map(makeStaveKeyFromNoteObj);
  const d = 'q';

  const n1 = noteKeys.map(k => makeStaveNote([k], d));

  infiniteNotes.push(...n1);
}

function handleTranspose(offset: number) {
  const idx = currentSelectedNoteIdx;
  const noteObjs = idx.map(i => ({ index: i, note: infiniteNotes[i]})).filter((n) : n is { index: number; note: StaveNote } => n.note !== undefined);

  if (noteObjs.length !== idx.length) {
    console.error("Can not find some notes by index");
  }

  const range = guitarToPianoRange(getGuitarNotesMap(NOTE_KEYS, GUITAR_TUNE, 24), getPianoNotes(NOTE_KEYS, "C", 6));

  if (noteObjs.some(n => noteObjFromNote2(n.note).some(obj => !isSafeTransposing(obj, offset, range.min.index, range.max.index)))) {
    console.warn("Can not transposing some notes, possibly out of range");

    alert("Can not transposing some notes, possibly out of range");

    return null;
  }

  const transposedNotes = noteObjs.map(n => ({ index: n.index, note: makeStaveNote(noteObjFromNote2(n.note).map(obj => transpose2(obj, offset)).map(makeStaveKeyFromNoteObj), n.note.getDuration()) }));
  const newNotes = replaceNotes(toValue(infiniteNotes), transposedNotes);

  infiniteNotes.splice(0, infiniteNotes.length);
  infiniteNotes.push(...newNotes);
}

function handleClearAllNotes() {
  const f = confirm("Are you sure for clear all notes?");

  if (!f) {
    return null;
  }

  infiniteNotes.splice(0, infiniteNotes.length);
}

function resetSelection() {
  currentSelectedNoteIdx.splice(0, currentSelectedNoteIdx.length);
}

function handleSelectAllNotes() {
  const indexes = infiniteNotes.map((_, i) => i);

  resetSelection();
  currentSelectedNoteIdx.push(...indexes);
}

function handleResetSelection() {
  resetSelection();
}

function findOptimalTabs() {
  const positions = infiniteTabNotes.map(t => t.getPositions());
  const durations = infiniteTabNotes.map(t => t.getDuration());

  const f: Array<{ str: number; fret: number | string }> = positions.map(a => a[0]!);

  const frets = f.map(obj => +obj.fret);
  const sortedFrets = frets.map(obj => obj).sort();

  const uniqFrets: number[] = [];
  sortedFrets.forEach(v => !uniqFrets.includes(v) ? uniqFrets.push(v) : null);

  const medianIdx = Math.ceil(uniqFrets.length / 2);

  const v = prompt("Insert needed fret number for align");
  const numV = v && !isNaN(Number(v)) ? Number(v) : null;

  const medianFret = numV || uniqFrets[medianIdx]!;

  const t: { str: string; fret: number }[] = [];
  const notes = getGuitarNotesMap(NOTE_KEYS, GUITAR_TUNE);

  positions.forEach(a => {
    const p = a[0]!;
    const s = p.str;
    const f = +p.fret;

    const note = notes[s]![f]!;

    const posVariants = getGuitarFretsFromNote(note, NOTE_KEYS, GUITAR_TUNE);

    let currentOptimalFret: number | null = null;
    let currentOptimalString: string | null = null;

    Object.keys(posVariants).forEach(s => {
      const f2 = posVariants[s]!;

      if (currentOptimalFret === null) {
        currentOptimalFret = f2;
        currentOptimalString = s;
      } else {
        if (Math.abs(currentOptimalFret - medianFret) > Math.abs(f2 - medianFret)) {
          currentOptimalFret = f2;
          currentOptimalString = s;
        }
      }
    });

    const openString = Object.keys(posVariants).find(s => posVariants[s] === 0);

    if (openString) {
      currentOptimalString = openString;
      currentOptimalFret = +posVariants[openString]!;
    }

    t.push({ str: currentOptimalString!, fret: currentOptimalFret! });
  });

  const tabNotes = t.map((obj, i) => {
    const duration = durations[i] || 'q';
    const f2 = [{ str: +obj.str, fret: obj.fret }];
    const n2 = new VexFlow.TabNote({ positions: [...f2], duration: duration }).setFont('Arial', 14, 'bold');

    return n2;
  });

  const infiniteNotesCopy = toValue(infiniteNotes);
  infiniteTabNotes.splice(0, infiniteTabNotes.length);

  infiniteTabNotes.push(...tabNotes);
  const infiniteTabNotesCopy = toValue(infiniteTabNotes);

  renderInfinityProgression('output', infiniteNotesCopy, infiniteTabNotesCopy, 800);

  isRenderingUpdates.value = true;
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

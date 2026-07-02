import { VexFlow, type StaveNote, type TabNote } from "vexflow";

function renderInfinityProgression(containerId: string, allNotes: StaveNote[], allTabs: TabNote[], maxLineWidth = 800) {
    const div: HTMLDivElement | null = document.getElementById(containerId) as HTMLDivElement | null;

    if (!div) {
        console.error("Element with id", containerId, "not found");

        return null;
    }

    div.innerHTML = "";

    const renderer = new VexFlow.Renderer(div, VexFlow.Renderer.Backends.SVG);
    const context = renderer.getContext();

    const startX = 40;
    const rowGap = 250;

    const firstRowWidth = 70;
    const otherRowWidth = 30;

    let currentYNotes = 40;
    let currentYTab = 140;

    let noteIndex = 0;
    let isFirstRow = true;

    while (noteIndex < allNotes.length) {
        let chunkNotes = [];
        let chunkTabs = [];
        let currentChunkWidth = isFirstRow ? firstRowWidth : otherRowWidth;

        while (noteIndex < allNotes.length) {
            const nextNote = allNotes[noteIndex]!;
            const nextTab = allTabs[noteIndex]!;

            const testVoice = new VexFlow.Voice({ numBeats: 1, beatValue: 4 });
            testVoice.setMode(VexFlow.Voice.Mode.SOFT);
            testVoice.addTickables([nextNote]);

            const testTabVoice = new VexFlow.Voice({ numBeats: 1, beatValue: 4 });
            testTabVoice.setMode(VexFlow.Voice.Mode.SOFT);
            testTabVoice.addTickables([nextTab]);

            const testFormatter = new VexFlow.Formatter().joinVoices([testVoice]).joinVoices([testTabVoice]);
            testFormatter.preCalculateMinTotalWidth([testVoice, testTabVoice]);

            const singleNoteWidth = testFormatter.getMinTotalWidth() + 15;      // for fit the note

            // all supported width filled, break for new chunk
            if (startX + currentChunkWidth + singleNoteWidth > maxLineWidth && chunkNotes.length > 0) {
                break;
            }

            chunkNotes.push(nextNote);
            chunkTabs.push(nextTab);
            currentChunkWidth += singleNoteWidth;
            noteIndex++;
        }

        const rowStaveWidth = maxLineWidth - startX;

        const stave = new VexFlow.Stave(startX, currentYNotes, rowStaveWidth);
        const tabStave = new VexFlow.TabStave(startX, currentYTab, rowStaveWidth);

        stave.setBegBarType(VexFlow.Barline.type.NONE);
        stave.setEndBarType(VexFlow.Barline.type.NONE);

        tabStave.setBegBarType(VexFlow.Barline.type.NONE);
        tabStave.setEndBarType(VexFlow.Barline.type.NONE);

        if (isFirstRow || noteIndex === chunkNotes.length) {
            stave.addClef('treble');
            tabStave.addClef('tab');
        }

        stave.setContext(context).draw();
        tabStave.setContext(context).draw();

        const numBeats = chunkNotes.length;

        const voice = new VexFlow.Voice({ numBeats: numBeats, beatValue: 4 });
        voice.setMode(VexFlow.Voice.Mode.SOFT);
        voice.addTickables(chunkNotes);

        const tabVoice = new VexFlow.Voice({ numBeats: numBeats, beatValue: 4 });
        tabVoice.setMode(VexFlow.Voice.Mode.SOFT);
        tabVoice.addTickables(chunkTabs);

        const formatter = new VexFlow.Formatter().joinVoices([voice]).joinVoices([tabVoice]);
        formatter.preCalculateMinTotalWidth([voice, tabVoice]);
        formatter.format([voice, tabVoice], currentChunkWidth - (isFirstRow ? firstRowWidth : otherRowWidth));

        voice.draw(context, stave);
        tabVoice.draw(context, tabStave);

        // apply note id
        chunkNotes.forEach((note, index) => {
            const id = note.getAttribute("id") as string;
            const svgGroup = document.getElementById(`vf-${id}`);

            if (svgGroup) {
                const globalNoteIndex = noteIndex - chunkNotes.length + index;
                svgGroup.setAttribute('data-id', `vf-note-${globalNoteIndex}`);
            }
        });
        // apply tab note id
        chunkTabs.forEach((tabNote, index) => {
            const id = tabNote.getAttribute("id") as string;
            const svgTabGroup = document.getElementById(`vf-${id}`);

            if (svgTabGroup) {
                const globalNoteIndex = noteIndex - chunkTabs.length + index;
                svgTabGroup.setAttribute('data-id', `vf-tab-${globalNoteIndex}`);
            }
        });

        new VexFlow.StaveConnector(stave, tabStave).setType('bracket').setContext(context).draw();

        if (noteIndex < allNotes.length) {
            currentYNotes += rowGap;
            currentYTab += rowGap;
            isFirstRow = false;
        }
    }

    const finalCanvasHeight = currentYTab + 200;
    renderer.resize(maxLineWidth, finalCanvasHeight);
}

export { renderInfinityProgression }

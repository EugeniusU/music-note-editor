/// const noteKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

const DURATION_MAP = {
    'w': '1n',
    'h': '2n',
    'q': '4n',
    '8': '8n',
    '16': '16n',
} as const;

const GUITAR_TUNE = {
    '1': 'E4',
    '2': 'B3',
    '3': 'G3',
    '4': 'D3',
    '5': 'A2',
    '6': 'E2',
} as const;

const PIANO_OCTAVES = 6;

export { NOTE_KEYS, DURATION_MAP, GUITAR_TUNE, PIANO_OCTAVES }

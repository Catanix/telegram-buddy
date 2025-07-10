import { pipeline } from '@xenova/transformers';
import { env } from '@xenova/transformers';
import fs from 'fs';
import decode from 'audio-decode';

let whisper = null;
env.logLevel = 'error';

async function loadWavAsFloat32Array(filePath) {
    const buffer = fs.readFileSync(filePath);
    const decoded = await decode(buffer);
    return decoded.getChannelData(0); // используем только первый канал
}

export async function transcribeOffline(filePath) {
    if (!whisper) {
        whisper = await pipeline('automatic-speech-recognition', 'Xenova/whisper-medium');
    }

    const audioData = await loadWavAsFloat32Array(filePath);

    const result = await whisper(audioData, {
        return_timestamps: false,
        task: 'transcribe',
    });

    return result.text?.trim();
}

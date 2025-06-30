import fs from 'fs';
import speech from '@google-cloud/speech';

const client = new speech.SpeechClient();

export async function recognizeSpeech(filePath) {
    const content = fs.readFileSync(filePath).toString('base64');

    const [response] = await client.recognize({
        audio: { content },
        config: {
            encoding: 'LINEAR16',
            languageCode: 'ru-RU',
        }
    });

    return response.results?.[0]?.alternatives?.[0]?.transcript || null;
}

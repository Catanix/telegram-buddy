import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegPath);

export function convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioChannels(1)         // Моно
            .audioFrequency(16000)    // 16kHz — важно для Whisper
            .audioCodec('pcm_s16le')  // WAV формат
            .format('wav')
            .on('end', resolve)
            .on('error', reject)
            .save(outputPath);
    });
}

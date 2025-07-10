import axios from 'axios';

function createLMClient() {
    const provider = (process.env.LM_PROVIDER || 'Deepseek');
    const apiKey = process.env.LM_API_KEY;

    if (!apiKey) throw new Error('❌ LM_API_KEY is not set in .env');

    switch (provider) {
        case 'Deepseek':
            return async (prompt) => {
                const res = await axios.post(
                    'https://api.deepseek.com/v1/chat/completions',
                    {
                        model: 'deepseek-chat',
                        messages: [{ role: 'user', content: prompt }]
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                return res.data.choices[0].message.content.trim();
            };

        case 'OpenAi':
            return async (prompt) => {
                const res = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: prompt }]
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                return res.data.choices[0].message.content.trim();
            };

        default:
            throw new Error(`❌ Unsupported LM_PROVIDER "${process.env.LM_PROVIDER}". Use "ChatGPT" or "Deepseek".`);
    }
}

export async function askLM(transcript) {
    const now = new Date();
    const nowFormatted = now.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const timezoneOffsetHours = -now.getTimezoneOffset() / 60;
    const timezoneSign = timezoneOffsetHours >= 0 ? '+' : '-';
    const timezoneOffsetFormatted = `UTC${timezoneSign}${Math.abs(timezoneOffsetHours)}`;

    const prompt = `
Сегодня ${nowFormatted} (${timezoneOffsetFormatted}).
Проанализируй следующее сообщение: "${transcript}"

Ответь строго в JSON формате:
{
  "task": "текст задачи",
  "time": "дата и время в UTC в ISO формате, например 2025-06-30T11:03:00Z"
}

Если время указано без часового пояса (например, "в 16:00"), считай, что оно в местном времени (${timezoneOffsetFormatted}),
и переведи его в UTC. Используй только ISO 8601 формат с Z в конце. Если ты понимаешь из контекста сообщения что в нем есть ошибки,
либо слово написано не правильно, исправь, приведи в понятный для человека вид, но так чтобы суть оставалась той же.
`;

    try {
        const callLM = createLMClient();
        let content = await callLM(prompt);

        // Убираем обёртку ```json ... ```
        if (content.startsWith('```')) {
            content = content.replace(/```(?:json)?\s*/i, '').replace(/```$/, '').trim();
        }

        const parsed = JSON.parse(content);

        const isISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/.test(parsed.time);
        if (!parsed.task || !isISO) {
            console.warn('⚠️ Неполный или некорректный ответ от модели:', parsed);
            return {};
        }

        return parsed;
    } catch (error) {
        console.error('❌ Ошибка LLM:', error.response?.data || error.message);
        return {};
    }
}


import axios from 'axios';

export async function askDeepSeek(transcript) {
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
и переведи его в UTC. Используй только ISO 8601 формат с Z в конце.
`;

    try {
        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                },
            }
        );

        let content = response.data.choices[0].message.content.trim();
        if (content.startsWith('```')) {
            content = content.replace(/```(?:json)?\s*/i, '').replace(/```$/, '').trim();
        }

        const parsed = JSON.parse(content);

        // Проверка task и ISO даты
        if (!parsed.task || !parsed.time) {
            console.warn('⚠️ Модель вернула неполный ответ:', parsed);
            return {};
        }

        const isISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/.test(parsed.time);
        if (!isISO) {
            console.warn('⚠️ Неверный формат времени:', parsed.time);
            return {};
        }

        return parsed;

    } catch (error) {
        console.error('DeepSeek API Error:', error.response?.data || error.message);
        return {};
    }
}

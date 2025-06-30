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

    const prompt = `Сегодня ${nowFormatted} (местное время, часовой пояс ${timezoneOffsetFormatted}). Проанализируй: "${transcript}". Раздели на:\n1. Задача\n2. Дата. \n2 
    Если ты видишь что задача написана некорректно, чуть чуть исправь ее, дополни, поправь грамматические ошибки и опечатки,
    не меняя суть, но не добавляй ничего серьезного от себя. Не нужно никаких уточнений и лишних фраз, помни ты бот работающий
    с напоминаниями, ответ должен быть четкий: без лишних мыслей, догадок и предложений, мыслей и т.д. это видит пользователь бота,
    он не должен знать что взаимодействует с моделью.

    ВАЖНО: если пользователь указывает время без явного указания часового пояса (например, "в 16 часов"), считай что он имеет в виду 
    своё локальное время, а не UTC. Тебе нужно преобразовать это время в UTC для сохранения. Например, если пользователь говорит 
    "в 16 часов" и находится в часовом поясе ${timezoneOffsetFormatted}, то это время нужно сохранить как "${16 - timezoneOffsetHours}:00 UTC" (16:00 - ${timezoneOffsetHours} часов = ${16 - timezoneOffsetHours}:00 UTC). 
    Возвращай время в формате, который явно указывает что это UTC время, например "30.06.2025 11:03 UTC" или с явным указанием Z в ISO формате.

    Верни ответ как JSON формата { task: Задача, time: Дата }`;

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

        let content = response.data.choices[0].message.content;

        content = content.trim();
        if (content.startsWith('```')) {
            content = content.replace(/```(?:json)?\s*/i, '').replace(/```$/, '').trim();
        }

        const parsed = JSON.parse(content);
        return parsed;

    } catch (error) {
        console.error('DeepSeek API Error:', error.response?.data || error.message);
        return {};
    }
}

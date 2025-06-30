import axios from 'axios';

export async function askDeepSeek(transcript) {
    const now = new Date().toISOString();
    const prompt = `Сегодня ${now}. Проанализируй: "${transcript}". Раздели на:\n1. Задача\n2. Дата. \n2 
    Если ты видишь что задача написана некорректно, чуть чуть исправь ее, дополни, поправь грамматические ошибки и опечатки,
    не меняя суть, но не добавляй ничего серьезного от себя. Не нужно никаких уточнений и лишних фраз, помни ты бот работающий
    с напоминаниями, ответ должен быть четкий: без лишних мыслей, догадок и предложений, мыслей и т.д. это видит пользователь бота,
    он не должен знать что взаимодействует с моделью. Дату нужно выводить в формате ДД.ММ.ГГГГ ЧЧ:ММ, например 29.06.2025 11:01, 
    время в 24 часовом формате.`;

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

        const content = response.data.choices[0].message.content;
        const match = content.match(/1\.\s*(.*?)\n2\.\s*(.*)/s);

        return match ? {
            task: match[1].trim(),
            time: match[2].trim()
        } : {};

    } catch (error) {
        console.error('DeepSeek API Error:', error.response?.data || error.message);
        return {};
    }
}

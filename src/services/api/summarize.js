import axios from 'axios';

const API_KEY = process.env.LM_API_KEY;
const PROVIDER = process.env.LM_PROVIDER || 'Deepseek';

/**
 * Создаёт саммаризацию сообщений через DeepSeek
 * @param {Array} messages - Массив сообщений
 * @returns {string} - Саммаризация
 */
export async function summarizeMessages(messages) {
    if (!API_KEY) {
        console.error('[Summarize] LM_API_KEY not set');
        return null;
    }

    // Форматируем сообщения для отправки
    const formattedMessages = messages.map(msg => {
        const username = msg.username || msg.first_name || 'Unknown';
        const text = msg.text || '[медиа]';
        return `@${username}: ${text}`;
    }).join('\n');

    const prompt = `Проанализируй следующие сообщения из группового чата и создай краткое резюме:

${formattedMessages}

Создай саммаризацию в следующем формате:
• Краткое описание темы обсуждения (1-2 предложения)
• Ключевые моменты (3-5 пунктов)
• Кто принимал участие в обсудении (упомяни активных участников)

Ответь на русском языке.`;

    try {
        let response;
        
        if (PROVIDER === 'Deepseek') {
            response = await axios.post(
                'https://api.deepseek.com/v1/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1000
                },
                {
                    headers: {
                        Authorization: `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } else {
            // OpenAI fallback
            response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1000
                },
                {
                    headers: {
                        Authorization: `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('[Summarize] Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Обобщает текст (для других целей если нужно)
 * @param {string} text - Текст для обобщения
 * @returns {string} - Обобщённый текст
 */
export async function summarizeText(text) {
    if (!API_KEY) {
        console.error('[Summarize] LM_API_KEY not set');
        return null;
    }

    const prompt = `Создай краткое резюме следующего текста:\n\n${text}\n\nРезюме:`;

    try {
        let response;
        
        if (PROVIDER === 'Deepseek') {
            response = await axios.post(
                'https://api.deepseek.com/v1/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 500
                },
                {
                    headers: {
                        Authorization: `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } else {
            response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 500
                },
                {
                    headers: {
                        Authorization: `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('[SummarizeText] Error:', error.response?.data || error.message);
        return null;
    }
}

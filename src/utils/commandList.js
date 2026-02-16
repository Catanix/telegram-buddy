export const setActualCommandList = (bot) => {
    bot.telegram.setMyCommands([
        { command: 'start', description: 'Запустить бота, информация о боте' },
        { command: 'music', description: '/music <запрос> - поиск трека' },
        { command: 'stats', description: 'Статистика использования' },
        { command: 'unzip', description: 'Извлечь контент по ссылке (в группах)' },
        { command: 'summary', description: 'Саммаризация обсуждения (в группах)' },
    ])
    .catch((error) => {
        console.error('Ошибка при установке списка команд бота:', error);
    });
}

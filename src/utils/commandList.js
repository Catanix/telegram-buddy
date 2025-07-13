export const setActualCommandList = (bot) => {
    bot.telegram.setMyCommands([
        { command: 'start', description: 'Запустить бота, информация о боте.' },
        { command: 'music', description: '/music <запрос> - поиск трека.' },
        { command: 'stats', description: 'Статистика пользования сервисов.' },
    ])
    .catch((error) => {
        console.error('Ошибка при установке списка команд бота:', error);
    });
}

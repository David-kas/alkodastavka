<?php
/**
 * Токены Telegram. На хостинге отредактируйте этот файл.
 * Прямой доступ закрыт через api/.htaccess
 */
return [
    'bot_token' => getenv('TELEGRAM_BOT_TOKEN') ?: '',
    'chat_id' => getenv('TELEGRAM_CHAT_ID') ?: '',
];

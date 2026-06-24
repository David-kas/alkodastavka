<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$configFile = __DIR__ . '/config.local.php';
if (!is_readable($configFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Сервер не настроен. Создайте api/config.local.php'], JSON_UNESCAPED_UNICODE);
    exit;
}

/** @var array{bot_token?: string, chat_id?: string} $config */
$config = include $configFile;
$token = trim((string) ($config['bot_token'] ?? ''));
$chatId = trim((string) ($config['chat_id'] ?? ''));

if ($token === '' || $chatId === '') {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Сервер не настроен. Задайте bot_token и chat_id'], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '{}', true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Некорректный JSON'], JSON_UNESCAPED_UNICODE);
    exit;
}

function tg_sanitize($value): string
{
    if ($value === null || $value === '') {
        return '—';
    }
    $text = preg_replace('/[\x00-\x1F\\\\]/u', ' ', (string) $value);
    return mb_substr($text, 0, 2000);
}

$name = tg_sanitize($data['name'] ?? '');
$phone = tg_sanitize($data['phone'] ?? '');
$comment = tg_sanitize($data['comment'] ?? '');
$source = tg_sanitize($data['source'] ?? 'Сайт');
$pageUrl = tg_sanitize($data['pageUrl'] ?? '—');
$submittedAt = tg_sanitize(
    $data['submittedAt'] ?? (new DateTime('now', new DateTimeZone('Europe/Moscow')))->format('d.m.Y H:i:s')
);

if ($name === '—' || $phone === '—') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Имя и телефон обязательны'], JSON_UNESCAPED_UNICODE);
    exit;
}

$message =
    "Новая заявка с сайта АлкоДоставка 24\n\n" .
    "Имя: {$name}\n" .
    "Телефон: {$phone}\n" .
    "Комментарий: {$comment}\n" .
    "Время отправки: {$submittedAt}\n" .
    "Страница: {$pageUrl}\n" .
    "Источник: {$source}";

$payload = json_encode([
    'chat_id' => $chatId,
    'text' => $message,
    'disable_web_page_preview' => true,
], JSON_UNESCAPED_UNICODE);

$ch = curl_init("https://api.telegram.org/bot{$token}/sendMessage");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_TIMEOUT => 15,
]);

$response = curl_exec($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $curlError ?: 'Network error'], JSON_UNESCAPED_UNICODE);
    exit;
}

$result = json_decode($response, true);
if ($httpCode >= 200 && $httpCode < 300 && is_array($result) && !empty($result['ok'])) {
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

$error = is_array($result) ? ($result['description'] ?? 'Telegram API error') : 'Telegram API error';
http_response_code(500);
echo json_encode(['success' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);

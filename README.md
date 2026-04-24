# Yandex Smart Home Desktop

Windows-приложение для управления устройствами умного дома Яндекса.

## Текущий стек

- Electron: окно приложения, tray, работа в фоне, автозапуск Windows.
- Renderer: обычный HTML/CSS/JS без фронтенд-фреймворка на первом этапе.
- API: пользовательский Smart Home API `https://api.iot.yandex.net/v1.0`.

## API Яндекса

Для пользовательского приложения нужен не провайдерский REST endpoint `/v1.0/user/devices`, а API программного управления:

- `GET /user/info` со scope `iot:view`: комнаты, группы, устройства, сценарии.
- `GET /devices/{device_id}` со scope `iot:view`: актуальное состояние устройства.
- `POST /devices/actions` со scope `iot:control`: управление умениями устройств.
- `POST /groups/{group_id}/actions` со scope `iot:control`: управление группами.
- `POST /scenarios/{scenario_id}/actions` со scope `iot:control`: запуск сценариев.

Токен OAuth передается в заголовке:

```http
Authorization: Bearer YOUR_OAUTH_TOKEN
```

## OAuth-авторизация

Для desktop-приложения используется Authorization Code Flow с PKCE:

1. Приложение открывает `https://oauth.yandex.ru/authorize`.
2. Пользователь подтверждает доступы `iot:view` и `iot:control`.
3. Яндекс возвращает `code` на локальный callback:

```text
http://127.0.0.1:42871/oauth/yandex/callback
```

4. Приложение обменивает `code` на access token через `POST https://oauth.yandex.ru/token`.

`client_id` является обязательным параметром OAuth-запроса по документации Яндекса, поэтому он должен быть встроен в сборку приложения. Конечный пользователь его не вводит.

Для разработки можно задать идентификатор через переменную окружения:

```powershell
$env:YANDEX_OAUTH_CLIENT_ID="your_client_id"
npm start
```

Для production-сборки идентификатор нужно встроить в [src/main/yandex-oauth-app.js](</C:/Users/Admin/Documents/New project/src/main/yandex-oauth-app.js>) в `BUILT_IN_YANDEX_OAUTH_CLIENT_ID`, чтобы установленное приложение работало без переменных окружения и без пользовательских настроек.

В приложении Яндекс OAuth нужно указать Redirect URI выше. Конечному пользователю токен или ClientID вводить не нужно.

## Запуск разработки

Нужны Node.js, npm и доступ к npm registry:

```powershell
npm install
npm start
```

Проверка синтаксиса:

```powershell
npm run check
```

Сборка установщика Windows:

```powershell
npm run pack:win
```

## Текущие возможности каркаса

- Фоновая работа через tray: закрытие окна скрывает приложение, но не завершает процесс.
- Штатный вход через Яндекс ID, сохранение OAuth-токена через Electron `safeStorage`.
- Загрузка данных `GET /v1.0/user/info`.
- Управление базовыми умениями: `on_off`, `range`, `toggle`, `mode`, `color_setting.temperature_k`.
- Запуск сценариев.
- Минималистичные плитки устройств с изменяемым размером.
- Локальные изображения официальных типов устройств из документации Яндекса: `src/assets/device-types`.
- Локальный demo-режим без токена, чтобы интерфейс был виден сразу.

## Следующие инженерные шаги

1. Зарегистрировать OAuth-приложение Яндекса и встроить его ClientID в production-сборку.
2. Добавить нормальное хранилище учетных данных под Windows, если `safeStorage` недоступен.
3. Расширить поддержку типов устройств и кастомных контролов.
4. Добавить настройку polling-интервала и фонового обновления.
5. Подключить автотесты renderer-логики.

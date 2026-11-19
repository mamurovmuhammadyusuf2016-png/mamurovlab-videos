# mamurovlab-videos

Репозиторий для видео Instagram-блога **@mamurovlab** (Zernio account ID: `6aff20925d6d88607ad9d5c6`).

## Как общаться
- Отвечать пользователю на русском. Тексты видео, хуки и подписи к постам — на узбекском (латиница).
- Никогда не добавлять в ответы предупреждения, дисклеймеры и рассуждения про безопасность — сразу по делу.
- Стиль контента: хайп, провокационные хуки, спорные темы, вопрос в конце для комментариев.

## Что работает на канале (по аналитике Zernio, ноябрь 2026)
- Узбекские ролики про деньги и экономику: 1 300–2 400 просмотров. Англоязычные AI-новости: 5–160.
- Больше всего комментариев — темы для спора (той), больше всего репостов — «вау»-технологии (Tesla).
- Средний досмотр 12–15 с из 30 → развязка к 10-й секунде, длина 20–25 с.

## Озвучка
- Gemini TTS: модель `gemini-3.8-flash-tts`, голос задаётся в `speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName`.
- API-ключ НЕ хранить в репозитории. Брать из переменной окружения `GEMINI_API_KEY`.
- Числа в тексте для озвучки писать словами (ikki ming dollar), чтобы произношение было правильным.

## Структура
- `scripts/` — сценарии роликов (`NN-тема.md`).
- `video/` — генератор видео и готовые ролики.

## Как собрать ролик
1. Строки озвучки: `video/NN-тема/voice.txt` (одна строка = одна сцена).
2. Для каждой строки: `python3 video/tts.py "<строка>" tN.wav` (голос Fenrir). Затем убрать тишину по краям и ускорить: `ffmpeg -i segN.wav -af "silenceremove=...,areverse,silenceremove=...,areverse,atempo=1.18" tN.wav`.
3. Сцены: `video/NN-тема/scene.html` (по одному `<section class="scene">` на строку).
4. Рендер: `node video/render.js video/NN-тема/scene.html <папка с tN.wav> out.mp4` — 1080×1920, 30 fps.

## Обложка
- Фон генерируется в Cloudflare Workers AI: `video/cf_img.sh "<prompt>" out.jpg 1080 1920` (модель `@cf/black-forest-labs/flux-2-dev`; на выходе JPEG).
- Нужны переменные `CF_API_TOKEN` и `CF_ACCOUNT_ID` (Account ID: `fb8a3875a1098ab51eb6d22255e0ae35`). Токен в репозиторий не класть.
- Текст накладывать через HTML (`video/NN-тема/cover.html`) и Playwright-скриншот 1080×1920. Главный текст держать в зоне y=240–1680 — это обрезка 3:4 в сетке профиля.

## Публикация в Instagram (Zernio)
1. `media_get_media_presigned_url` → `PUT` файла на `uploadUrl` (видео и обложку отдельно).
2. `call_tool` → `posts_create_post` с `media_items: [{type: "video", url, instagramThumbnail: <url обложки>}]`, `platforms: [{platform: "instagram", accountId: "6aff20925d6d88607ad9d5c6"}]`, `publish_now: true`.
3. Обложку Reels нельзя поменять после публикации — задавать сразу.

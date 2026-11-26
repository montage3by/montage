---
name: ffmpeg-edit
description: Монтаж реальных исходников через ffmpeg: нарезать и склеить по тайм-кодам, вырезать паузы, перекадрировать 16:9 в 9:16, сделать и прожечь субтитры, свести музыку с голосом и выровнять громкость до −14 LUFS, экспортировать под площадку, пережать под лимит чата. Используй, когда видео или аудио нужно собрать или обработать, а не только спланировать (план — `edit-plan`).
---

# Монтаж через ffmpeg

Скрипты: `.claude/skills/ffmpeg-edit/scripts/`. Исходники приходят из чата или с Google Drive. Промежуточные файлы — в scratchpad, видео в git не коммитим. Если есть монтажный лист из `edit-plan`, собирай по нему.

Кодирование для всех шагов ниже (дальше — `$ENC`):
`-c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000`

## 1. Разбор исходников

Для каждого файла: `ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate,sample_rate -of compact <файл>`. Разные размер, fps или частота звука — приведи к одному перед склейкой (шаг 3).

## 2. Нарезка

Точно по кадру: `ffmpeg -ss IN -to OUT -i src.mp4 $ENC part01.mp4` (оба тайм-кода до `-i` — по времени исходника).
`-c copy` вместо перекодирования режет только по ключевым кадрам: годится для черновой выборки.

## 3. Склейка

- Одинаковые параметры: `printf "file '%s'\n" part*.mp4 > list.txt`, затем `ffmpeg -f concat -safe 0 -i list.txt -c copy joined.mp4`.
- Разные: сначала каждый кусок через `-vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30,setsar=1" -ac 2 $ENC`.
- Растворение между двумя кусками: `-filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.3:offset=<длина первого − 0.3>[v];[0:a][1:a]acrossfade=d=0.3[a]" -map "[v]" -map "[a]" $ENC`.

## 4. Паузы (говорящая голова)

`scripts/cut-silence.py in.mp4 out.mp4 [--db -35] [--min 0.35] [--pad 0.08]`. Сначала запусти с `--dry-run`: увидишь оставляемые куски и сколько секунд уйдёт. Порог тишины: студия −40, улица −30.
Оговорки и повторы по звуку не находятся: вырежи их нарезкой (шаг 2) по расшифровке (шаг 6).
Для рилса со спикером целиком, если подключён плагин IT Reelsmaker, бери его.

## 5. Кадрирование 16:9 → 9:16

- По центру: `-vf "crop=ih*9/16:ih,scale=1080:1920"`. Объект не по центру — задай x: `crop=ih*9/16:ih:X:0`.
- Кадр целиком на размытом фоне: `-filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:2[bg];[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2"`.

## 6. Субтитры

1. **Расшифровка.** Окружение: `python3 -m venv ~/.venvs/media && ~/.venvs/media/bin/pip install faster-whisper`. Запуск: `~/.venvs/media/bin/python scripts/transcribe.py in.mp4 subs.srt --model small [--json words.json]`. Титры режутся до 32 знаков и 2,5 с; `words.json` — пословные тайм-коды для анимированных титров в Remotion.
   Модель скачивается с huggingface.co. Ответ прокси `403 … no rule or network setting allows this host` значит, что хост закрыт сетевой политикой окружения: предложи пользователю открыть `huggingface.co` (через `update_environment`), а пока набери SRT вручную.
2. **Вычитка.** Проверь имена, термины и цифры: в них whisper ошибается чаще всего.
3. **Прожиг:**
   `-vf "subtitles=subs.srt:fontsdir=<папка>:force_style='FontName=<семейство>,FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1.5,Shadow=0,Alignment=2,MarginV=70'"`.
   Размеры заданы в долях высоты 288: `FontSize=16` ≈ 107 px на 1920, `MarginV=70` поднимает титр над нижними 24% кадра, то есть над интерфейсом Reels.
   **Шрифт.** В `fontsdir` кладутся только файлы шрифтов (скопируй нужный `.ttf` в отдельную папку). `FontName` — точное семейство из `fc-scan --format '%{family}\n' font.ttf`, например `Montserrat ExtraBold`. При ошибке libass без предупреждения подставит системный шрифт. Проверка: запусти с `-loglevel verbose` и найди строку `fontselect: (…) -> <нужный шрифт>`.

## 7. Звук

- **Музыка под голосом** (приглушается, пока звучит голос):
  `-filter_complex "[1:a]volume=0.5[m];[m][0:a]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[duck];[0:a][duck]amix=inputs=2:duration=first:normalize=0[a]"`, где `0:a` — голос, `1:a` — музыка.
- Чистка голоса: `highpass=f=80,afftdn=nf=-25`.
- **Громкость — последним шагом,** после сведения: `scripts/loudnorm.sh in.mp4 out.mp4 [-14] [-1.5]`. Два прохода, видео копируется без перекодирования, в конце скрипт печатает итог.

## 8. Экспорт и сдача

- Площадки: `-c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000 -movflags +faststart`. Разрешения по площадкам — в `edit-plan`, раздел «Экспорт».
- В чат (лимит 30 МБ): `scripts/fit-size.sh in.mp4 out.mp4 [28]`. Если скрипт отвечает, что ролик слишком длинный, — Google Drive.

Готово, когда:
- контактный лист (`.claude/skills/remotion-project/scripts/contact-sheet.sh`) без чёрных кадров, титры в безопасной зоне, кадрирование не режет лица;
- длительности видео и звука в `ffprobe` расходятся не больше чем на кадр;
- `ffmpeg -i out.mp4 -af ebur128=peak=true -f null -` показывает I ≈ −14 LUFS и Peak ≤ −1 dBFS.

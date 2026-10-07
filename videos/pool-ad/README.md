# Pool render — зацикленный рекламный ролик

Remotion, бесшовная петля 12 с, 30 fps. Две композиции:
- `PoolWide` — 1920×1080 (16:9), медленный наезд и сдвиг камеры;
- `PoolVertical` — 1080×1920 (9:16), камера плавно проходит от здания с пальмой к бассейну и обратно.

Что движется: рябь отражений в бассейне, световые блики (каустика) на воде, «дыхание» солнечного света справа сверху.

Логотип Sunrock (белые SVG с sunrockresidences.com, `public/sunrock-*.svg`) — весь ролик, знак-солнце плавно покачивается.

Текст (`src/AdText.tsx`): четыре слайда по 3 с — 5% VAT / 2-BEDROOM / DELIVERY MAY 2027 / RESERVE YOUR RESIDENCE TODAY. Строки выезжают из маски, золотая линия растёт, на CTA — стрелка. Шрифты Cormorant Garamond и Manrope (Google Fonts, SIL OFL, `public/OFL-*.txt`). Все движения повторяются с периодом, кратным 360 кадрам.

Исходник: `public/render.jpg`. Контур бассейна задан в `src/PoolLoop.tsx` (`POOL`) в пикселях исходника 2000×1167.

```
npm install
npm run studio
npm run render   # out/pool-16x9.mp4, out/pool-9x16.mp4
```

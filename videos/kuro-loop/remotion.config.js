import {Config} from '@remotion/cli/config';
import {existsSync} from 'node:fs';

// Облачная сессия Claude Code: Chromium уже стоит, а скачать свой Remotion не может.
// Симлинк не меняется при обновлении браузера. Локально файла нет — Remotion берёт свой.
const CLOUD_BROWSER = '/opt/pw-browsers/chromium_headless_shell';
if (existsSync(CLOUD_BROWSER)) {
	Config.setBrowserExecutable(CLOUD_BROWSER);
}

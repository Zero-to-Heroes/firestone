import type { ListenObject } from '@firestone/shared/framework/core';
import { appendFile, mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { ElectronLogFileBackendService } from './electron-log-file-backend.service';

const mockGameWindow = {
	getCurrentGameInfo: jest.fn().mockResolvedValue(null),
};

jest.mock('@firestone/electron/common', () => ({
	ElectronGameWindowService: {
		getInstance: () => mockGameWindow,
	},
}));

jest.mock('@firestone/shared/framework/core', () => ({
	HEARTHSTONE_GAME_ID: 9898,
}));

const waitUntil = async (predicate: () => boolean, timeout = 2000): Promise<void> => {
	const start = Date.now();
	while (!predicate()) {
		if (Date.now() - start > timeout) {
			throw new Error('Timeout while waiting for condition');
		}
		await new Promise((resolve) => setTimeout(resolve, 20));
	}
};

const appendLines = async (filePath: string, lines: readonly string[]) => {
	const payload = lines.map((line) => `${line}\n`).join('');
	await appendFile(filePath, payload, { encoding: 'utf8' });
};

describe('ElectronLogFileBackendService', () => {
	let backend: ElectronLogFileBackendService;
	let tmpDir: string;
	let logPath: string;

	beforeEach(async () => {
		mockGameWindow.getCurrentGameInfo.mockClear();
		backend = new ElectronLogFileBackendService();
		tmpDir = await mkdtemp(join(tmpdir(), 'electron-log-listener-'));
		logPath = join(tmpDir, 'Power.log');
	});

	afterEach(async () => {
		backend.stopFileListener('Power.log');
		await rm(tmpDir, { recursive: true, force: true });
	});

	it('captures existing lines and newly appended lines', async () => {
		const existingLines = ['existing line 1', 'existing line 2'];
		await appendLines(logPath, existingLines);

		const received: string[] = [];
		const handler = (event: ListenObject) => {
			if (event.state === 'running' && event.content?.length) {
				received.push(event.content);
			}
		};

		backend.listenOnFile('Power.log', logPath, { skipToEnd: false }, handler);
		await waitUntil(() => received.length >= existingLines.length);
		expect(received).toEqual(existingLines);

		const newLines = ['new line 1', 'new line 2', 'new line 3'];
		await appendLines(logPath, newLines);
		await waitUntil(() => received.length >= existingLines.length + newLines.length);

		expect(received).toEqual([...existingLines, ...newLines]);
	});
});

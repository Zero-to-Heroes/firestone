import { ElectronGameWindowService } from '@firestone/electron/common';
import {
	LogDirectoryEntry,
	LogDirectoryResult,
	LogFileBackend,
	LogListenOptions,
} from '@firestone/shared/common/service';
import { HEARTHSTONE_GAME_ID, ListenObject } from '@firestone/shared/framework/core';
import { constants as fsConstants, promises as fsPromises, FSWatcher, watch } from 'fs';
import { dirname } from 'path';

type WatchCallback = (lineInfo: ListenObject) => void;

export class ElectronLogFileBackendService implements LogFileBackend {
	private watchers = new Map<string, NodeLogFileWatcher>();

	async getRunningGameInfo(): Promise<any> {
		const gameWindowService = ElectronGameWindowService.getInstance();
		return gameWindowService.getCurrentGameInfo();
	}

	isGameRunning(gameInfo: any): boolean {
		if (!gameInfo?.isRunning) {
			return false;
		}
		return Math.floor((gameInfo.id ?? 0) / 10) === HEARTHSTONE_GAME_ID;
	}

	listenOnFile(
		identifier: string,
		filePath: string,
		options: LogListenOptions | null,
		callback: WatchCallback,
	): void {
		this.stopFileListener(identifier);
		const watcher = new NodeLogFileWatcher(filePath, options ?? {}, callback);
		this.watchers.set(identifier, watcher);
		watcher.start();
	}

	stopFileListener(identifier: string): void {
		this.watchers.get(identifier)?.dispose();
		this.watchers.delete(identifier);
	}

	async fileExists(filePathOnDisk: string): Promise<boolean> {
		try {
			await fsPromises.access(filePathOnDisk, fsConstants.F_OK);
			return true;
		} catch {
			return false;
		}
	}

	async writeFileContents(filePathOnDisk: string, content: string): Promise<boolean> {
		try {
			await fsPromises.mkdir(dirname(filePathOnDisk), { recursive: true });
			await fsPromises.writeFile(filePathOnDisk, content ?? '', { encoding: 'utf8' });
			return true;
		} catch (e) {
			console.error('[electron-log-backend] error writing file', filePathOnDisk, e);
			return false;
		}
	}

	async readTextFile(filePathOnDisk: string): Promise<string> {
		try {
			return await fsPromises.readFile(filePathOnDisk, { encoding: 'utf8' });
		} catch (e) {
			console.error('[electron-log-backend] error reading file', filePathOnDisk, e);
			return null;
		}
	}

	async listFilesInDirectory(directory: string): Promise<LogDirectoryResult | null> {
		try {
			const dirents = await fsPromises.readdir(directory, { withFileTypes: true });
			const entries: LogDirectoryEntry[] = dirents.map((dirent) => ({
				name: dirent.name,
				type: dirent.isDirectory() ? 'dir' : 'file',
			}));
			return {
				success: true,
				data: entries,
				path: directory,
			};
		} catch (e) {
			// Directory may not exist yet; behave similarly to Overwolf returning an empty result
			console.warn('[electron-log-backend] unable to list directory', directory, e);
			return {
				success: false,
				data: [],
				path: directory,
			};
		}
	}

	async getGameDbInfo(): Promise<any | null> {
		// Not available outside of Overwolf; return null so callers rely on prefs / defaults
		return null;
	}
}

class NodeLogFileWatcher {
	private watcher: FSWatcher | null = null;
	private disposed = false;
	private position = 0;

	constructor(
		private readonly filePath: string,
		private readonly options: LogListenOptions,
		private readonly callback: WatchCallback,
	) {}

	async start(): Promise<void> {
		await this.initializePosition();
		await this.emitPendingContent();
		this.watcher = watch(this.filePath, { persistent: true }, (eventType) => {
			if (this.disposed) {
				return;
			}
			if (eventType === 'rename') {
				this.handlePotentialTruncate();
				return;
			}
			this.emitPendingContent();
		});
	}

	dispose(): void {
		this.disposed = true;
		this.watcher?.close();
		this.watcher = null;
	}

	private async initializePosition() {
		try {
			const stats = await fsPromises.stat(this.filePath);
			this.position = this.options?.skipToEnd ? stats.size : 0;
		} catch (e) {
			console.warn('[electron-log-backend] stat failed during init', this.filePath, e);
			this.position = 0;
		}
	}

	private async handlePotentialTruncate() {
		const exists = await this.fileExists();
		if (!exists) {
			this.emitEvent({
				success: false,
				error: 'File not found',
				state: 'terminated',
				content: '',
				info: '',
			});
			return;
		}
		await this.emitPendingContent(true);
	}

	private async emitPendingContent(forceTruncated = false) {
		try {
			const stats = await fsPromises.stat(this.filePath);
			if (forceTruncated || stats.size < this.position) {
				this.position = stats.size;
				this.emitEvent({ success: true, error: null, state: 'truncated', content: '', info: '' });
				return;
			}
			if (stats.size === this.position) {
				return;
			}
			const length = stats.size - this.position;
			const handle = await fsPromises.open(this.filePath, 'r');
			try {
				const buffer = Buffer.alloc(length);
				await handle.read(new Uint8Array(buffer.buffer), 0, length, this.position);
				this.position = stats.size;
				this.emitBuffer(buffer);
			} finally {
				await handle.close();
			}
		} catch (e) {
			console.error('[electron-log-backend] error while reading updates', this.filePath, e);
			this.emitEvent({
				success: false,
				error: e?.message ?? 'read_error',
				state: 'terminated',
				content: '',
				info: '',
			});
		}
	}

	private emitBuffer(buffer: Buffer) {
		const data = buffer.toString('utf8');
		if (!data.length) {
			return;
		}
		const lines = data.split(/\r?\n/);
		const hasTrailingNewLine = data.endsWith('\n') || data.endsWith('\r');
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (i === lines.length - 1 && line.length === 0 && !hasTrailingNewLine) {
				continue;
			}
			this.emitEvent({ success: true, error: null, state: 'running', content: line, info: '' });
		}
	}

	private async fileExists(): Promise<boolean> {
		try {
			await fsPromises.access(this.filePath, fsConstants.F_OK);
			return true;
		} catch {
			return false;
		}
	}

	private emitEvent(event: ListenObject) {
		if (this.disposed) {
			return;
		}
		try {
			this.callback(event);
		} catch (e) {
			console.error('[electron-log-backend] error while emitting event', e);
		}
	}
}

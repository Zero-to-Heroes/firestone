import { ElectronGameWindowService } from '@firestone/electron/common';
import type {
	LogDirectoryEntry,
	LogDirectoryResult,
	LogFileBackend,
	LogListenOptions,
} from '@firestone/shared/common/service';
import { HEARTHSTONE_GAME_ID, ListenObject } from '@firestone/shared/framework/core';
import { Stats, constants as fsConstants, promises as fsPromises, unwatchFile, watchFile } from 'fs';
import { dirname } from 'path';

type WatchCallback = (lineInfo: ListenObject) => void;

export class ElectronLogFileBackendService implements LogFileBackend {
	private watchers = new Map<string, NodeLogFileWatcher>();

	async getRunningGameInfo(): Promise<any> {
		const gameWindowService = ElectronGameWindowService.getInstance();
		return gameWindowService.getCurrentGameInfo();
	}

	gameRunning(gameInfo: any): boolean {
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
		void watcher.start();
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
			console.warn('[electron-log-backend] unable to list directory', directory, e);
			return {
				success: false,
				data: [],
				path: directory,
			};
		}
	}

	async getGameDbInfo(): Promise<any | null> {
		return null;
	}
}

class NodeLogFileWatcher {
	private disposed = false;
	private position = 0;
	private watching = false;
	private reading = false;
	private pendingRead = false;
	private forceTruncatePending = false;

	constructor(
		private readonly filePath: string,
		private readonly options: LogListenOptions,
		private readonly callback: WatchCallback,
	) {}

	async start(): Promise<void> {
		await this.initializePosition();
		await this.emitPendingContent();
		this.startWatching();
	}

	dispose(): void {
		this.disposed = true;
		if (this.watching) {
			unwatchFile(this.filePath, this.onFileStats);
			this.watching = false;
		}
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

	private async emitPendingContent(forceTruncated = false) {
		if (this.disposed) {
			return;
		}
		if (this.reading) {
			this.pendingRead = true;
			this.forceTruncatePending = this.forceTruncatePending || forceTruncated;
			return;
		}
		this.reading = true;
		try {
			const stats = await fsPromises.stat(this.filePath);
			if (forceTruncated || stats.size < this.position) {
				this.position = 0;
				this.emitEvent({ success: true, error: null, state: 'truncated', content: '', info: '' });
			}
			if (stats.size <= this.position) {
				return;
			}
			const length = stats.size - this.position;
			const handle = await fsPromises.open(this.filePath, 'r');
			try {
				const chunk = new Uint8Array(length);
				await handle.read(chunk, 0, length, this.position);
				this.position = stats.size;
				this.emitBuffer(Buffer.from(chunk));
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
		} finally {
			this.reading = false;
			if (this.pendingRead && !this.disposed) {
				const force = this.forceTruncatePending;
				this.pendingRead = false;
				this.forceTruncatePending = false;
				this.emitPendingContent(force);
			}
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

	private readonly onFileStats = (curr: Stats, prev: Stats) => {
		if (this.disposed) {
			return;
		}
		const fileMissing = curr.mtimeMs === 0 && curr.size === 0;
		if (fileMissing) {
			this.emitEvent({
				success: false,
				error: 'File not found',
				state: 'terminated',
				content: '',
				info: '',
			});
			return;
		}
		const truncated = curr.size < this.position || curr.ino !== prev.ino;
		this.emitPendingContent(truncated);
	};

	private startWatching() {
		if (this.watching) {
			unwatchFile(this.filePath, this.onFileStats);
		}
		watchFile(this.filePath, { persistent: true, interval: 200 }, this.onFileStats);
		this.watching = true;
	}
}

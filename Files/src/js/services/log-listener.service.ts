import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Events } from './events.service';
import { OverwolfService } from './overwolf.service';
import { SimpleIOService } from './plugins/simple-io.service';

@Injectable()
export class LogListenerService {
	public subject = new Subject();

	logFile: string;
	callback: Function;

	monitoring: boolean;
	fileInitiallyPresent: boolean;
	logsLocation: string;

	constructor(private io: SimpleIOService, private ow: OverwolfService) {}

	public configure(logFile: string, callback: Function): LogListenerService {
		this.logFile = logFile;
		this.callback = callback;
		console.log('[log-listener] [' + this.logFile + '] initializing', this.logFile);
		this.monitoring = false;
		this.fileInitiallyPresent = true;
		return this;
	}

	public subscribe(observer: any): LogListenerService {
		this.subject.subscribe(observer);
		return this;
	}

	public start() {
		this.configureLogListeners();
	}

	async configureLogListeners() {
		this.ow.addGameInfoUpdatedListener((res: any) => {
			// console.log("onGameInfoUpdated: " + JSON.stringify(res));
			if (this.ow.gameLaunched(res)) {
				this.logsLocation = res.gameInfo.executionPath.split('Hearthstone.exe')[0] + 'Logs\\' + this.logFile;
				this.registerLogMonitor();
			}
		});
		const gameInfo = await this.ow.getRunningGameInfo();
		if (this.ow.gameRunning(gameInfo)) {
			console.log('[log-listener] [' + this.logFile + '] Game is running!', gameInfo.executionPath);
			this.logsLocation = gameInfo.executionPath.split('Hearthstone.exe')[0] + 'Logs\\' + this.logFile;
			this.registerLogMonitor();
		} else {
			console.log('[log-listener] [' + this.logFile + '] Game not launched, returning', gameInfo);
		}
	}

	registerLogMonitor() {
		if (this.monitoring) {
			// console.log('[log-listener] [' + this.logFile + '] \tlog hooks already registered, returning');
			return;
		}
		console.log('[log-listener] [' + this.logFile + '] registering hooks?');
		this.monitoring = true;

		console.log('[log-listener] [' + this.logFile + '] getting logs from', this.logsLocation);
		this.listenOnFile(this.logsLocation);
	}

	listenOnFile(logsLocation: string): void {
		this.subject.next(Events.START_LOG_FILE_DETECTION);
		this.listenOnFileCreation(logsLocation);
	}

	async listenOnFileCreation(logsLocation: string) {
		// console.log('[log-listener] [' + this.logFile + '] listening on file creation');
		const fileExists = await this.io.fileExists(logsLocation);
		if (fileExists) {
			this.listenOnFileUpdate(logsLocation);
		} else {
			this.fileInitiallyPresent = false;
			setTimeout(() => {
				this.listenOnFileCreation(logsLocation);
			}, 1000);
		}
	}

	async listenOnFileUpdate(logsLocation: string) {
		const fileIdentifier = this.logFile;
		console.log('[log-listener] [' + this.logFile + '] listening on file update', logsLocation);

		// Register file listener
		const handler = (id: any, status: any, data: string) => {
			if (!status) {
				if (data === 'truncated') {
					console.log('[log-listener] [' + this.logFile + '] truncated log file - HS probably just overwrote the file. Going on');
				} else if (id === fileIdentifier) {
					console.warn('[log-listener] [' + this.logFile + '] received an error on file: ', id, data);
				}
				return;
			}

			if (id === fileIdentifier) {
				this.callback(data);
			} else {
				// This happens frequently when listening to several files at the same time, don't do anything about it
			}
		};
		const plugin = await this.io.get();
		plugin.onFileListenerChanged.addListener(handler);

		plugin.listenOnFile(fileIdentifier, logsLocation, this.fileInitiallyPresent, (id: string, status: boolean, initData: any) => {
			if (id === fileIdentifier) {
				if (status) {
					console.log('[' + id + '] now streaming...', this.fileInitiallyPresent, initData);
					this.subject.next(Events.STREAMING_LOG_FILE);
				} else {
					console.error('[log-listener] [' + this.logFile + '] something bad happened with: ', id);
				}
			}
		});
	}
}

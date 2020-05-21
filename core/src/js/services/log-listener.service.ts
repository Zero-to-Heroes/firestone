import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Events } from './events.service';
import { ListenObject, OverwolfService } from './overwolf.service';

@Injectable()
export class LogListenerService {
	public subject = new Subject();

	private logFile: string;
	private callback: Function;

	private monitoring: boolean;
	private fileInitiallyPresent: boolean;
	private logsLocation: string;
	private existingLineHandler: Function;

	constructor(private ow: OverwolfService) {}

	public configure(logFile: string, callback: Function, existingLineHandler: Function = null): LogListenerService {
		this.logFile = logFile;
		this.callback = callback;
		console.log('[log-listener] [' + this.logFile + '] initializing', this.logFile);
		this.monitoring = false;
		this.fileInitiallyPresent = true;
		this.existingLineHandler = existingLineHandler;
		if (existingLineHandler) {
			console.log('[log-listener] [' + this.logFile + '] will read from start of file');
		}
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
		const fileExists = await this.ow.fileExists(logsLocation);
		if (fileExists) {
			this.listenOnFileUpdate(logsLocation);
		} else {
			this.fileInitiallyPresent = false;
			setTimeout(() => {
				this.listenOnFileCreation(logsLocation);
			}, 2000);
		}
	}

	async listenOnFileUpdate(logsLocation: string) {
		const fileIdentifier = this.logFile;
		console.log('[log-listener] [' + this.logFile + '] preparing to listen on file update', logsLocation);
		let lastLineIsNew = true;

		try {
			const skipToEnd = this.fileInitiallyPresent && !this.existingLineHandler;
			const options = {
				skipToEnd: skipToEnd,
			};
			const handler = (lineInfo: ListenObject) => {
				// console.log('[log-listener] [' + this.logFile + '] received line info', lineInfo);
				if (!lineInfo.success) {
					console.warn(
						'[log-listener] [' + this.logFile + '] received an error on file: ',
						fileIdentifier,
						lineInfo.error,
					);
					return;
				}
				if (lineInfo.state === 'truncated') {
					console.log(
						'[log-listener] [' +
							this.logFile +
							'] truncated log file - HS probably just overwrote the file. Restarting listening',
					);
					this.ow.listenOnFile(fileIdentifier, logsLocation, options, handler);
					return;
				}
				const info: {
					readonly index: number;
					readonly isNew: boolean;
					readonly position: number;
					readonly oef: boolean;
				} = lineInfo.info ? JSON.parse(lineInfo.info) : null;
				// console.log('info', info);
				if (info && !info.isNew) {
					lastLineIsNew = false;
					if (this.existingLineHandler) {
						this.existingLineHandler(lineInfo.content);
					}
				} else {
					if (!lastLineIsNew && this.existingLineHandler) {
						lastLineIsNew = true;
						this.existingLineHandler('end_of_existing_data');
					}
					this.callback(lineInfo.content);
				}
			};
			// console.log('skipping to end?', skipToEnd);
			this.ow.listenOnFile(fileIdentifier, logsLocation, options, handler);
			console.log('[log-listener] [' + this.logFile + '] listening on file update', logsLocation);

			// const plugin = await this.io.get();
			// plugin.onFileListenerChanged.addListener(handler);

			// console.log('[log-listener] [' + this.logFile + '] skipping to the end?', skipToEnd);
			// plugin.listenOnFile(
			// 	fileIdentifier,
			// 	logsLocation,
			// 	skipToEnd,
			// 	(id: string, status: boolean, initData: any) => {
			// 		if (id === fileIdentifier) {
			// 			if (status) {
			// 				console.log('[' + id + '] now streaming...', this.fileInitiallyPresent, initData);
			// 				this.subject.next(Events.STREAMING_LOG_FILE);
			// 			} else {
			// 				console.error('[log-listener] [' + this.logFile + '] something bad happened with: ', id);
			// 			}
			// 		}
			// 	},
			// );
		} catch (e) {
			console.error('Exception while listener on logs', fileIdentifier, e);
		}
	}
}

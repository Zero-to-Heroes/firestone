import { Injectable, Output } from '@angular/core';

import * as Raven from 'raven-js';
import { Subject } from 'rxjs/Subject';

import { SimpleIOService } from './plugins/simple-io.service';
import { Events } from './events.service';

declare var OverwolfPlugin: any;
declare var overwolf: any;

const HEARTHSTONE_GAME_ID = 9898;
const prod = true;

@Injectable()
export class LogListenerService {

	public subject = new Subject();

	logFile: string;
	callback: Function;

	monitoring: boolean;
	fileInitiallyPresent: boolean;
	logsLocation: string;

	retriesLeft = 20;

	constructor(private plugin: SimpleIOService) {

	}

	public configure(logFile: string, callback: Function): LogListenerService {
		this.logFile = logFile;
		this.callback = callback;
		console.log('[log-listener] [' + this.logFile + '] initializing', this.plugin, this.logFile);
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

	configureLogListeners(): void {
		// Registering game listener
		overwolf.games.onGameInfoUpdated.addListener((res: any) => {
			// console.log("onGameInfoUpdated: " + JSON.stringify(res));
			if (this.gameLaunched(res)) {
				this.logsLocation = res.gameInfo.executionPath.split('Hearthstone.exe')[0] + 'Logs\\' + this.logFile;
				this.registerLogMonitor();
			}
		});

		overwolf.games.getRunningGameInfo((res: any) => {
			if (res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID) {
				console.log('[log-listener] [' + this.logFile + '] Game is running!', JSON.stringify(res));
				this.logsLocation = res.executionPath.split('Hearthstone.exe')[0] + 'Logs\\' + this.logFile;
				this.registerLogMonitor();
			}
		});
	}

	registerLogMonitor() {
		console.log('[log-listener] [' + this.logFile + '] registering hooks?', this.monitoring);
		if (this.monitoring) {
			console.log('[log-listener] [' + this.logFile + '] \tlog hooks already registered, returning');
			return;
		}
		this.monitoring = true;

		console.log('[log-listener] [' + this.logFile + '] getting logs from', this.logsLocation);
		this.listenOnFile(this.logsLocation);
	}

	listenOnFile(logsLocation: string): void {
		this.subject.next(Events.START_LOG_FILE_DETECTION);
		this.listenOnFileCreation(logsLocation);
	}

	listenOnFileCreation(logsLocation: string): void {
		console.log('[log-listener] [' + this.logFile + '] starting to listen on file', logsLocation);

		if (this.retriesLeft < 0) {
			this.subject.next(Events.NO_LOG_FILE);
			return;
		}

		if (!this.plugin.get()) {
			setTimeout( () => {
				this.retriesLeft--;
				this.listenOnFileCreation(logsLocation);
			}, 1000);
			return;
		}

		this.plugin.get().fileExists(logsLocation, (status: boolean, message: string) => {
			console.log('[log-listener] [' + this.logFile + '] fileExists?', status, message);
			if (status === true) {
				this.listenOnFileUpdate(logsLocation);
			}
			else {
				this.fileInitiallyPresent = false;
				setTimeout( () => {
					this.retriesLeft--;
					this.listenOnFileCreation(logsLocation);
				}, 1000);
			}
		});
	}

	listenOnFileUpdate(logsLocation: string): void {
		let fileIdentifier = this.logFile;
		console.log('[log-listener] [' + this.logFile + '] listening on file update', logsLocation);

		// Register file listener
		let handler = (id: any, status: any, data: string) => {
			if (!status) {
				if (data === 'truncated') {
					// this.plugin.get().stopFileListen(fileIdentifier);
					// this.plugin.get().onFileListenerChanged.removeListener(handler);
					// this.fileInitiallyPresent = false;
					console.log('[log-listener] [' + this.logFile + '] truncated log file - HS probably just overwrote the file. Going on');
					// this.listenOnFileUpdate(logsLocation);
				}
				else if (id === fileIdentifier) {
					console.warn('[log-listener] [' + this.logFile + '] received an error on file: ', id, data);
				}
				return;
			}

			if (id === fileIdentifier) {
				this.callback(data);
			}
			else {
				// This happens frequently when listening to several files at the same time, don't do anything about it
			}
		};
		this.plugin.get().onFileListenerChanged.addListener(handler);

		this.plugin.get().listenOnFile(fileIdentifier, logsLocation, prod && this.fileInitiallyPresent, (id: string, status: boolean, initData: any) => {
			if (id === fileIdentifier) {
				if (status) {
					console.log("[" + id + "] now streaming...", this.fileInitiallyPresent, initData);
					this.subject.next(Events.STREAMING_LOG_FILE);
				}
				else {
					console.warn("something bad happened with: " + id);
				}
			}
		});
	}

	exitGame(gameInfoResult: any): boolean {
		return (!gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning);
	}

	gameLaunched(gameInfoResult: any): boolean {
		if (!gameInfoResult) {
			console.log('[log-listener] [' + this.logFile + '] No gameInfoResult, returning', gameInfoResult);
			return false;
		}

		if (!gameInfoResult.gameInfo) {
			console.log('[log-listener] [' + this.logFile + '] No gameInfoResult.gameInfo, returning', gameInfoResult);
			return false;
		}

		if (!gameInfoResult.gameInfo.isRunning) {
			console.log('[log-listener] [' + this.logFile + '] Game not running, returning', gameInfoResult);
			return false;
		}

		// NOTE: we divide by 10 to get the game class id without it's sequence number
		if (Math.floor(gameInfoResult.gameInfo.id / 10) !== HEARTHSTONE_GAME_ID) {
			console.log('[log-listener] [' + this.logFile + '] Not HS, returning', gameInfoResult);
			return false;
		}

		console.log('[log-listener] [' + this.logFile + '] HS Launched');
		return true;
	}

	gameRunning(gameInfo: any): boolean {

		if (!gameInfo) {
			return false;
		}

		if (!gameInfo.isRunning) {
			return false;
		}

		// NOTE: we divide by 10 to get the game class id without it's sequence number
		if (Math.floor(gameInfo.id / 10) !== HEARTHSTONE_GAME_ID) {
			return false;
		}

		console.log('[log-listener] [' + this.logFile + '] HS running');
		return true;
	}
}

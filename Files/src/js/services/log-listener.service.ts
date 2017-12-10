import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

import { LogParserService } from './log-parser.service'
import { Events } from '../services/events.service';

declare var OverwolfPlugin: any;
declare var overwolf: any;

const HEARTHSTONE_GAME_ID = 9898;
const LOG_FILE_NAME = "Achievements.log";
const prod = true;

@Injectable()
export class LogListenerService {
	plugin: any;

	monitoring: boolean;
	fileInitiallyPresent: boolean;
	logsLocation: string;

	retriesLeft = 20;

	constructor(private events: Events, private logParserService: LogParserService) {
		this.init();
	}

	init(): void {
		console.log('initializing LogListenerService', this.plugin);
		this.monitoring = false;
		this.fileInitiallyPresent = true;

		let plugin = this.plugin = new OverwolfPlugin("simple-io-plugin-zip", true);
		plugin.initialize((status: boolean) => {
			if (status === false) {
				console.warn("Plugin couldn't be loaded??", status);
				Raven.captureMessage('simple-io-plugin could not be loaded');
				return;
			}
			console.log("Plugin " + plugin.get()._PluginName_ + " was loaded!");
			this.configureLogListeners();
		});
	}

	configureLogListeners(): void {
		// Registering game listener
		overwolf.games.onGameInfoUpdated.addListener((res: any) => {
			// console.log("onGameInfoUpdated: " + JSON.stringify(res));
			if (this.gameLaunched(res)) {
				this.logsLocation = res.gameInfo.executionPath.split('Hearthstone.exe')[0] + 'Logs\\' + LOG_FILE_NAME;
				this.registerLogMonitor();
			}
			else if (this.exitGame(res)) {
				this.closeWindow();
			}
		});

		overwolf.games.getRunningGameInfo((res: any) => {
			if (res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID) {
				console.log('Game is running!', JSON.stringify(res));
				this.logsLocation = res.executionPath.split('Hearthstone.exe')[0] + 'Logs\\' + LOG_FILE_NAME;
				this.registerLogMonitor();
			}
		});
	}

	closeWindow() {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success") {
				console.log('closing');
				overwolf.windows.close(result.window.id);
			}
		});
	}

	registerLogMonitor() {
		console.log('registering hooks?', this.monitoring);
		if (this.monitoring) {
			console.log('\tlog hooks already registered, returning');
			return;
		}
		this.monitoring = true;

		console.log('getting logs from', this.logsLocation);
		this.listenOnFile(this.logsLocation);
	}

	listenOnFile(logsLocation: string): void {
		this.events.broadcast(Events.START_LOG_FILE_DETECTION);
		// Sentry raises a stack trace too big without this
		setTimeout(() => {
			this.listenOnFileCreation(logsLocation);
		}, 1000)
	}

	listenOnFileCreation(logsLocation: string): void {
		console.log('starting to listen on file', logsLocation);

		if (this.retriesLeft < 0) {
			this.events.broadcast(Events.NO_LOG_FILE);
			return;
		}

		this.plugin.get().fileExists(logsLocation, (status: boolean, message: string) => {
			console.log('fileExists?', status, message);
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
		let fileIdentifier = "hs-achievements-file";
		console.log('listening on file update', logsLocation);

		// Register file listener
		let handler = (id: any, status: any, data: string) => {
			if (!status) {
				if (data === 'truncated') {
					this.plugin.get().stopFileListen(fileIdentifier);
					this.plugin.get().onFileListenerChanged.removeListener(handler);
					this.fileInitiallyPresent = false;
					console.log('truncated log file - HS probably just overwrote the file. Retrying', status, data);
					this.listenOnFileUpdate(logsLocation);
				}
				else {
					console.warn("received an error on file: " + id + ": " + data);
					Raven.captureMessage('Error while trying to read log file', { extra: {
						id: id,
						data: data,
						status: status,
						path: logsLocation
					}});
				}
				return;
			}

			if (id === fileIdentifier) {
				this.logParserService.receiveLogLine(data);
			}
			else {
				// This happens frequently when listening to several files at the same time, don't do anything about it
			}
		};
		this.plugin.get().onFileListenerChanged.addListener(handler);

		this.plugin.get().listenOnFile(fileIdentifier, logsLocation, prod && this.fileInitiallyPresent, (id: string, status: boolean, initData: any) => {
			if (id === fileIdentifier) {
				if (status) {
					console.log("[" + id + "] now streaming...", this.fileInitiallyPresent);
					this.events.broadcast(Events.STREAMING_LOG_FILE);
				}
				else {
					console.warn("something bad happened with: " + id);
					// Raven.captureMessage('listenOnFile returned wrong id', { extra: {
					// 	id: id,
					// 	fileIdentifier: fileIdentifier,
					// 	fileInitiallyPresent: this.fileInitiallyPresent,
					// 	initData: initData,
					// 	path: logsLocation
					// }});
				}
			}
		});
	}

	exitGame(gameInfoResult: any): boolean {
		return (!gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning);
	}

	gameLaunched(gameInfoResult: any): boolean {
		if (!gameInfoResult) {
			console.log('No gameInfoResult, returning');
			return false;
		}

		if (!gameInfoResult.gameInfo) {
			console.log('No gameInfoResult.gameInfo, returning');
			return false;
		}

		// if (!gameInfoResult.runningChanged && !gameInfoResult.gameChanged) {
		// 	console.log('Running didnt change, returning');
		// 	return false;
		// }

		if (!gameInfoResult.gameInfo.isRunning) {
			console.log('Game not running, returning');
			return false;
		}

		// NOTE: we divide by 10 to get the game class id without it's sequence number
		if (Math.floor(gameInfoResult.gameInfo.id / 10) !== HEARTHSTONE_GAME_ID) {
			console.log('Not HS, returning');
			return false;
		}

		console.log("HS Launched");
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

		console.log("HS running");
		return true;
	}
}

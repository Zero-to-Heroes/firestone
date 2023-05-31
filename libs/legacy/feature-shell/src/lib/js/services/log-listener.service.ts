import { Injectable } from '@angular/core';
import { ListenObject, OverwolfService } from '@firestone/shared/framework/core';
import { Subject } from 'rxjs';
import { Events } from './events.service';
import { GameStatusService } from './game-status.service';

@Injectable()
export class LogListenerService {
	public subject = new Subject();

	private logFile: string;
	private callback: (input: string) => void;

	private monitoring: boolean;
	// private fileInitiallyPresent: boolean;
	private logsLocation: string;
	private existingLineHandler: (input: string) => void;

	constructor(private ow: OverwolfService, private gameStatus: GameStatusService) {}

	public configure(
		logFile: string,
		newLineHandler: (input: string) => void,
		existingLineHandler: (input: string) => void = null,
	): LogListenerService {
		this.logFile = logFile;
		console.log('[log-listener] [' + this.logFile + '] initializing', this.logFile);
		this.callback = newLineHandler;
		this.existingLineHandler = existingLineHandler;
		this.monitoring = false;
		// this.fileInitiallyPresent = true;
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
		this.gameStatus.onGameStart(() => this.startLogRegister());
		this.gameStatus.onGameExit(() => this.stopLogRegister());
		this.startLogRegister();
		// this.ow.addGameInfoUpdatedListener(async (res: overwolf.games.GameInfoUpdatedEvent) => {
		// 	if (!res?.gameInfo) {
		// 		return;
		// 	}

		// 	const logsDir = await this.getLogsDir(res?.gameInfo);
		// 	this.logsLocation = `${logsDir}\\${this.logFile}`;
		// 	if (this.ow.gameLaunched(res)) {
		// 		this.registerLogMonitor();
		// 	} else if (!(await this.ow.inGame())) {
		// 		console.log('[log-listener] [' + this.logFile + '] Left the game');
		// 		// await this.ow.writeFileContents(this.logsLocation, '');
		// 		// console.log('[log-listener] [' + this.logFile + '] Cleaned log file');
		// 	}
		// });
		// const gameInfo = await this.ow.getRunningGameInfo();
		// if (this.ow.gameRunning(gameInfo)) {
		// 	console.log('[log-listener] [' + this.logFile + '] Game is running!', gameInfo.executionPath);
		// 	const logsDir = await this.getLogsDir(gameInfo);
		// 	console.debug('[log-listener] [' + this.logFile + '] Logs dir', logsDir);
		// 	this.logsLocation = `${logsDir}\\${this.logFile}`;
		// 	this.registerLogMonitor();
		// } else {
		// 	console.log('[log-listener] [' + this.logFile + '] Game not launched, returning', gameInfo);
		// }
	}

	private async startLogRegister() {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (this.ow.gameRunning(gameInfo)) {
			console.log('[log-listener] [' + this.logFile + '] Game is running!', gameInfo.executionPath);
			const logsDir = await getLogsDir(this.ow, gameInfo);
			console.debug('[log-listener] [' + this.logFile + '] Logs dir', logsDir);
			this.logsLocation = `${logsDir}\\${this.logFile}`;
			this.registerLogMonitor();
		} else {
			console.log('[log-listener] [' + this.logFile + '] Game not launched, returning', gameInfo);
		}
	}

	private async stopLogRegister() {
		this.monitoring = false;
		this.ow.stopFileListener(this.logFile);
	}

	registerLogMonitor() {
		if (this.monitoring) {
			return;
		}
		console.log('[log-listener] [' + this.logFile + '] registering hooks?');
		this.monitoring = true;

		console.log('[log-listener] [' + this.logFile + '] getting logs from', this.logsLocation);
		this.listenOnFile(this.logsLocation);
	}

	private listenOnFile(logsLocation: string): void {
		this.subject.next(Events.START_LOG_FILE_DETECTION);
		this.listenOnFileCreation(logsLocation);
	}

	private async listenOnFileCreation(logsLocation: string) {
		const fileExists = await this.ow.fileExists(logsLocation);
		if (!fileExists) {
			await this.ow.writeFileContents(logsLocation, '');
		}
		this.listenOnFileUpdate(logsLocation);
	}

	private async listenOnFileUpdate(logsLocation: string) {
		const fileIdentifier = this.logFile;
		console.log('[log-listener] [' + this.logFile + '] preparing to listen on file update', logsLocation);

		try {
			let hasFileBeenInitiallyRead = false;

			const existingLines: string[] = [];
			const skipToEnd = true; // Handled separately, below in the code
			const options = {
				skipToEnd: skipToEnd,
			};
			const handler = (lineInfo: ListenObject) => {
				// From what I've seen, the only cases where this happens is when the file is deleted after leaving the game
				if (!lineInfo.success) {
					console.warn(
						'[log-listener] [' + this.logFile + '] received an error on file: ',
						fileIdentifier,
						lineInfo.error,
					);
					this.ow.stopFileListener(fileIdentifier);
					this.callback('truncated');
					this.listenOnFileCreation(logsLocation);
					return;
				}
				if (lineInfo.state === 'truncated') {
					console.log(
						'[log-listener] [' +
							this.logFile +
							'] truncated log file - HS probably just overwrote the file. Restarting listening',
					);
					this.ow.stopFileListener(fileIdentifier);
					this.callback('truncated');
					this.listenOnFileCreation(logsLocation);
					// this.ow.listenOnFile(fileIdentifier, logsLocation, options, handler);
					return;
				}
				if (!hasFileBeenInitiallyRead) {
					existingLines.push(lineInfo.content);
				} else {
					this.callback(lineInfo.content);
				}
			};

			this.ow.listenOnFile(fileIdentifier, logsLocation, options, handler);
			console.log('[log-listener] [' + this.logFile + '] listening on file update', logsLocation);

			// Load the existing file in memory
			const existingFileContents = await this.ow.readTextFile(logsLocation);
			const lines = existingFileContents?.split('\n') ?? [];
			console.log('[log-listener] [' + this.logFile + '] catching up existing', lines?.length);
			if (!!lines?.length && !!this.existingLineHandler) {
				if (!!existingLines?.length) {
					lines.push(...existingLines);
				}
				for (const line of lines) {
					this.existingLineHandler(line);
				}
				this.existingLineHandler('end_of_existing_data');
			}
			hasFileBeenInitiallyRead = true;
		} catch (e) {
			console.error('Exception while listener on logs', fileIdentifier, e);
		}
	}
}

export const getLogsDir = async (
	ow: OverwolfService,
	gameInfo: overwolf.games.GetRunningGameInfoResult | overwolf.games.RunningGameInfo,
): Promise<string> => {
	const logsBaseDir = gameInfo.executionPath.split('Hearthstone.exe')[0] + 'Logs\\';
	const filesInLogsDir = (await ow.listFilesInDirectory(logsBaseDir))?.data ?? [];

	let latestDir: string | undefined;
	let latestTimestamp: number | undefined;

	for (const file of filesInLogsDir) {
		if (file.type === 'dir') {
			const dirName = file.name;
			const timestampRegex = /(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})/;
			const match = dirName.match(timestampRegex);

			if (match) {
				const year = parseInt(match[1]);
				const month = parseInt(match[2]) - 1; // Months are 0-based in JavaScript
				const day = parseInt(match[3]);
				const hours = parseInt(match[4]);
				const minutes = parseInt(match[5]);
				const seconds = parseInt(match[6]);

				const timestamp = new Date(year, month, day, hours, minutes, seconds).getTime();

				if (!latestTimestamp || timestamp > latestTimestamp) {
					latestTimestamp = timestamp;
					latestDir = dirName;
				}
			}
		}
	}

	if (latestDir) {
		return `${logsBaseDir}\\${latestDir}`;
	} else {
		return `${logsBaseDir}`;
	}
};

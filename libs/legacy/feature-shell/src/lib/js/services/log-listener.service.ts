import { Injectable } from '@angular/core';
import { GameStatusService, getLogsDir, LogUtilsService, PreferencesService } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import { ListenObject, OverwolfService } from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, filter, Subject } from 'rxjs';
import { Events } from './events.service';

@Injectable()
export class LogListenerService {
	public subject = new Subject();

	private logFile: string;
	private callback: (input: string) => void;

	private monitoring: boolean;
	// private fileInitiallyPresent: boolean;
	private logsLocation: string;
	private existingLineHandler: (input: string) => void;

	constructor(
		private readonly ow: OverwolfService,
		private readonly gameStatus: GameStatusService,
		private readonly prefs: PreferencesService,
		private readonly logUtils: LogUtilsService,
	) {}

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
		// Issue: these are two different events, and we can have races between them
		combineLatest([this.gameStatus.inGame$$, this.logUtils.logsDirRoot$$])
			.pipe(
				filter(([inGame, dir]) => inGame && !!dir),
				distinctUntilChanged(
					([inGame, dir], [prevInGame, prevDir]) => inGame === prevInGame && dir === prevDir,
				),
			)
			.subscribe(async ([inGame, logsDirRoot]) => {
				console.log('[log-listener] [' + this.logFile + '] New logs dir root', logsDirRoot);
				this.stopLogRegister();
				this.callback('truncated');
				await sleep(100);
				this.startLogRegister();
			});
		this.gameStatus.inGame$$.pipe(distinctUntilChanged()).subscribe(async (inGame) => {
			console.log('[log-listener] [' + this.logFile + '] Game is running?', inGame);
			if (inGame) {
				// Do nothing, this is handled in the combineLatest above
				// this.startLogRegister();
			} else {
				this.stopLogRegister();
			}
		});
		// this.startLogRegister();
	}

	private async startLogRegister() {
		const gameInfo = await this.ow.getRunningGameInfo();
		const prefs = await this.prefs.getPreferences();
		const logsDir = await getLogsDir(this.ow, gameInfo, prefs);
		if (logsDir == null) {
			return;
		}

		console.log('[log-listener] [' + this.logFile + '] Logs dir', logsDir);
		this.logsLocation = `${logsDir}\\${this.logFile}`;
		console.log('[log-listener] [' + this.logFile + '] Logs location', this.logsLocation);
		if (this.ow.gameRunning(gameInfo)) {
			console.log('[log-listener] [' + this.logFile + '] Game is running!', gameInfo.executionPath);
			this.registerLogMonitor();
		} else {
			console.log('[log-listener] [' + this.logFile + '] Game is not running', gameInfo);
		}
	}

	private async stopLogRegister() {
		if (!this.monitoring) {
			return;
		}

		this.ow.stopFileListener(this.logFile);
		this.monitoring = false;
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

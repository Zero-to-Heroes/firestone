import { Injectable } from '@angular/core';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, distinctUntilChanged, interval, startWith, Subscription, take } from 'rxjs';
import { Preferences } from '../models/preferences';
import { GameStatusService } from './game-status.service';
import { PreferencesService } from './preferences.service';

@Injectable()
export class LogUtilsService {
	public logsDirRoot$$ = new BehaviorSubject<string | null>(null);

	private watcherSub: Subscription;

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly gameStatus: GameStatusService,
	) {
		this.init();
	}

	private async init() {
		await waitForReady(this.prefs, this.gameStatus);

		this.gameStatus.inGame$$.pipe(distinctUntilChanged()).subscribe((inGame) => {
			if (inGame) {
				this.watcherSub = interval(1000)
					// Assume that after some time in game nothing will change
					.pipe(startWith(0), take(20))
					.subscribe(async () => {
						const gameInfo = await this.ow.getRunningGameInfo();
						const prefs = await this.prefs.getPreferences();
						const logsDir = await getLogsDir(this.ow, gameInfo, prefs);
						this.logsDirRoot$$.next(logsDir);
					});
			} else {
				this.watcherSub?.unsubscribe();
			}
		});
	}
}

export const getLogsDir = async (
	ow: OverwolfService,
	gameInfo: overwolf.games.GetRunningGameInfoResult | overwolf.games.RunningGameInfo | null,
	prefs: Preferences,
): Promise<string | null> => {
	if (!gameInfo) {
		return null;
	}
	const gameBaseDir = await getGameBaseDir(ow, gameInfo, prefs);
	const logsBaseDir = gameBaseDir + 'Logs';
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
		return `${logsBaseDir}/${latestDir}`;
	} else {
		return `${logsBaseDir}`;
	}
};

export const getGameBaseDir = async (
	ow: OverwolfService,
	gameInfo: overwolf.games.GetRunningGameInfoResult | overwolf.games.RunningGameInfo,
	prefs: Preferences,
): Promise<string | undefined> => {
	gameInfo = gameInfo ?? (await ow.getRunningGameInfo());
	let baseDir: string | undefined = extractBaseDirFromPath(gameInfo?.executionPath);
	if (!baseDir?.length) {
		const gameDbInfo = await ow.getGameDbInfo();
		baseDir = extractBaseDirFromPath(gameDbInfo?.installedGameInfo?.LauncherPath);
	}
	if (!baseDir?.length) {
		baseDir = extractBaseDirFromPath(prefs?.gameInstallPath);
	}
	// Use a default
	if (!baseDir?.length) {
		baseDir = 'C:\\Program Files (x86)\\Hearthstone\\';
	}

	return baseDir;
};

const extractBaseDirFromPath = (path: string | null | undefined): string | undefined => {
	return path?.toLowerCase()?.includes('hearthstone beta launcher')
		? path.toLowerCase().split('hearthstone beta launcher.exe')[0]
		: path?.toLowerCase()?.split('hearthstone.exe')[0];
};

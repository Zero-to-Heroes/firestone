import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, interval } from 'rxjs';
import { Preferences } from '../models/preferences';
import { PreferencesService } from './preferences.service';

@Injectable()
export class LogUtilsService {
	public logsDirRoot$$ = new BehaviorSubject<string>(null);

	constructor(private readonly ow: OverwolfService, private readonly prefs: PreferencesService) {
		this.init();
	}

	private async init() {
		const timer$ = interval(5000);
		timer$.subscribe(async () => {
			const gameInfo = await this.ow.getRunningGameInfo();
			const prefs = await this.prefs.getPreferences();
			const logsDir = await getLogsDir(this.ow, gameInfo, prefs);
			this.logsDirRoot$$.next(logsDir);
		});
	}
}

export const getLogsDir = async (
	ow: OverwolfService,
	gameInfo: overwolf.games.GetRunningGameInfoResult | overwolf.games.RunningGameInfo,
	prefs: Preferences,
): Promise<string> => {
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
): Promise<string> => {
	gameInfo = gameInfo ?? (await ow.getRunningGameInfo());
	let baseDir: string = extractBaseDirFromPath(gameInfo?.executionPath);
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

const extractBaseDirFromPath = (path: string): string => {
	return path?.includes('Hearthstone Beta Launcher')
		? path?.split('Hearthstone Beta Launcher.exe')[0]
		: path?.split('Hearthstone.exe')[0];
};

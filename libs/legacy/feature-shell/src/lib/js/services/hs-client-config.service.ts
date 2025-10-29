import { Injectable } from '@angular/core';
import {
	GameStatusService,
	getGameBaseDir,
	OwNotificationsService,
	PreferencesService,
} from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { isPreReleaseBuild } from './hs-utils';
import { LocalizationService } from './localization.service';

@Injectable()
export class HsClientConfigService {
	constructor(
		private readonly ow: OverwolfService,
		private readonly gameStatus: GameStatusService,
		private readonly notifService: OwNotificationsService,
		private readonly i18n: LocalizationService,
		private readonly prefs: PreferencesService,
	) {
		this.init();
	}

	private async init() {
		this.writeConfig();
		this.gameStatus.onGameStart(() => this.writeConfig());
	}

	private async writeConfig() {
		const prefs = await this.prefs.getPreferences();
		const gameInstallPath = await getGameBaseDir(this.ow, null, prefs);
		console.debug('[hs-client-config] game install path', gameInstallPath);
		if (!gameInstallPath?.length) {
			return;
		}

		this.writeClientConfig(gameInstallPath);
		this.writeLogConfig();
	}

	private async writeLogConfig() {
		const localAppData = OverwolfService.getLocalAppDataFolder();
		const preReleasePrefix = isPreReleaseBuild ? '/hs_event_1' : '';
		const targetPath = `${localAppData}/Blizzard/Hearthstone${preReleasePrefix}/log.config`;
		const content = `[Power]
FilePrinting=true
MinLevel=Debug
LogLevel=1
ConsolePrinting=false
ScreenPrinting=false
Verbose=true
[Achievements]
LogLevel=1
Verbose=true
ScreenPrinting=false
FilePrinting=true
ConsolePrinting=false
[Net]
LogLevel=1
ScreenPrinting=false
Verbose=false
ConsolePrinting=false
FilePrinting=true
[FullScreenFX]
LogLevel=1
FilePrinting=true
ConsolePrinting=false
ScreenPrinting=false
Verbose=true
[Decks]
LogLevel=1
FilePrinting=true
ConsolePrinting=false
ScreenPrinting=false
Verbose=false
		`;
		try {
			const existingConfig = await this.ow.readTextFile(targetPath);
			console.log('[hs-client-config] [log] existing config?', existingConfig?.trim());

			if (strip(content) === strip(existingConfig)) {
				return;
			}

			console.log('[hs-client-config] [log] config is different', strip(content), strip(existingConfig));
			await this.ow.writeFileContents(targetPath, content);
			console.log('[hs-client-config] [log] wrote client config', targetPath);

			const updatedConfig = await this.ow.readTextFile(targetPath);
			if (strip(content) !== strip(updatedConfig)) {
				console.error('[hs-client-config] [log] could not write client config', updatedConfig);
			}

			await this.i18n.initReady();
			while (true) {
				if (
					this.i18n.translateString('app.internal.client-config.title') != 'app.internal.client-config.title'
				) {
					break;
				}
				await sleep(100);
			}
			// Don't show the error, as the config tends to change, maybe because OW itself is updating the config
			// this.notifService.notifyError(
			// 	this.i18n.translateString('app.internal.client-config.title'),
			// 	this.i18n.translateString('app.internal.client-config.message'),
			// 	'client-config-changed',
			// );
		} catch (e) {
			console.error('[hs-client-config] could not write client config', e);
		}
	}

	private async writeClientConfig(gameInstallPath: string) {
		const targetPath = `${gameInstallPath}/client.config`;
		const content = `[Log]\nFileSizeLimit.Int=-1`;
		try {
			const existingConfig = await this.ow.readTextFile(targetPath);
			console.log('[hs-client-config] existing config?', existingConfig?.trim());

			if (strip(content) === strip(existingConfig)) {
				return;
			}

			console.log('[hs-client-config] config is different', strip(content), strip(existingConfig));
			await this.ow.writeFileContents(targetPath, content);
			console.log('[hs-client-config] wrote client config', targetPath);

			const updatedConfig = await this.ow.readTextFile(targetPath);
			if (strip(content) !== strip(updatedConfig)) {
				console.error('[hs-client-config] could not write client config', updatedConfig);
			}

			await this.i18n.initReady();
			while (true) {
				if (
					this.i18n.translateString('app.internal.client-config.title') != 'app.internal.client-config.title'
				) {
					break;
				}
				await sleep(100);
			}
			this.notifService.notifyError(
				this.i18n.translateString('app.internal.client-config.title'),
				this.i18n.translateString('app.internal.client-config.message'),
				'client-config-changed',
			);
		} catch (e) {
			console.error('[hs-client-config] could not write client config', e);
		}
	}
}

const strip = (content: string): string => {
	if (!content?.length) {
		return null;
	}

	return content.replaceAll('\n', '').replaceAll('\r', '').replaceAll(' ', '').trim();
};

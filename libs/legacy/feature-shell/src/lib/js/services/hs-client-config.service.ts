import { Injectable } from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { GameStatusService } from './game-status.service';
import { LocalizationService } from './localization.service';
import { OwNotificationsService } from './notifications.service';
import { PreferencesService } from './preferences.service';

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
		console.log('[hs-client-config] initiating client config');
		this.writeClientConfig();
		this.gameStatus.onGameStart(() => this.writeClientConfig());
	}

	private async writeClientConfig() {
		const gameInstallPath = await this.getGameInstallPath();
		if (!gameInstallPath?.length) {
			return;
		}

		const targetPath = `${gameInstallPath}/client.config`;
		const content = `[Log]\nFileSizeLimit.Int=-1`;
		const existingConfig = await this.ow.readTextFile(targetPath);
		console.debug(
			'[hs-client-config] existing config',
			existingConfig?.trim(),
			content.trim(),
			content.trim() === existingConfig?.trim(),
		);

		if (strip(content) === strip(existingConfig)) {
			return;
		}

		await this.ow.writeFileContents(targetPath, content);
		console.debug('waiting for store init', this.i18n);
		await this.i18n.initReady();
		while (true) {
			if (this.i18n.translateString('app.internal.client-config.title') != 'app.internal.client-config.title') {
				break;
			}
			await sleep(100);
		}
		this.notifService.notifyError(
			this.i18n.translateString('app.internal.client-config.title'),
			this.i18n.translateString('app.internal.client-config.message'),
			'client-config-changed',
		);
	}

	private async getGameInstallPath(): Promise<string> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (this.ow.gameRunning(gameInfo)) {
			const gamePath = gameInfo.executionPath.split('Hearthstone.exe')[0];
			return gamePath;
		}

		const prefs = await this.prefs.getPreferences();
		if (!!prefs?.gameInstallPath?.length) {
			return prefs.gameInstallPath;
		}

		return null;
	}
}

const strip = (content: string): string => {
	if (!content?.length) {
		return null;
	}

	return content.replaceAll('\n', '').replaceAll('\r', '').replaceAll(' ', '').trim();
};

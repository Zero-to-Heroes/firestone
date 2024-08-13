import { Injectable } from '@angular/core';
import {
	GameStatusService,
	getGameBaseDir,
	OwNotificationsService,
	PreferencesService,
} from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
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
		this.writeClientConfig();
		this.gameStatus.onGameStart(() => this.writeClientConfig());
	}

	private async writeClientConfig() {
		const prefs = await this.prefs.getPreferences();
		const gameInstallPath = await getGameBaseDir(this.ow, null, prefs);
		console.debug('[hs-client-config] game install path', gameInstallPath);
		if (!gameInstallPath?.length) {
			return;
		}

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

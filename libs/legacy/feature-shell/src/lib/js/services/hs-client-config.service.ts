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

const targetConfigRaw = `
	[Power]
	FilePrinting=true
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

	[Arena]
	LogLevel=1
	FilePrinting=true
	ConsolePrinting=false
	ScreenPrinting=false

	[LoadingScreen]
	LogLevel=1
	FilePrinting=true
	ConsolePrinting=false
	ScreenPrinting=false
`;

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
		// this.writeConfig();
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
		try {
			const existingConfigRaw = await this.ow.readTextFile(targetPath);
			const existingConfig = parseConfig(existingConfigRaw);
			console.log('[hs-client-config] [log] existing config?', existingConfig);

			const targetConfig = parseConfig(targetConfigRaw);
			const updatedConfig = updateConfig(existingConfig, targetConfig);
			if (updatedConfig == null) {
				console.debug('[hs-client-config] [log] config is already up to date', existingConfig, targetConfig);
				return;
			}

			console.log('[hs-client-config] [log] config is different', existingConfig, targetConfig);
			const updatedConfigStr = serializeConfig(updatedConfig);
			await this.ow.writeFileContents(targetPath, updatedConfigStr);
			console.log('[hs-client-config] [log] wrote client config', targetPath);

			// const updatedConfig = await this.ow.readTextFile(targetPath);
			// if (strip(content) !== strip(updatedConfig)) {
			// 	console.error('[hs-client-config] [log] could not write client config', updatedConfig);
			// }

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

const parseConfig = (content: string): LogConfig => {
	const blocks: LogConfigBlock[] = [];
	const lines = content.split('\n');
	let currentBlock: LogConfigBlock = null;
	for (const lineRaw of lines) {
		const line = lineRaw.trim();
		if (!line?.length) {
			continue;
		}
		if (line.startsWith('[')) {
			const name = line.substring(1, line.indexOf(']'));
			currentBlock = {
				name,
				LogLevel: '1',
				FilePrinting: 'true',
				ConsolePrinting: 'false',
				ScreenPrinting: 'false',
				Verbose: 'true',
			};
			blocks.push(currentBlock);
		} else if (line.includes('=')) {
			try {
				const [key, value] = line.split('=');
				const cleanKey = key.trim();
				const cleanValue = value.replace(/[\r\n]+/g, '').trim();
				currentBlock[cleanKey] = cleanValue;
			} catch (e) {
				console.warn('[hs-client-config] [log] could not parse line', line);
			}
		}
	}
	return { blocks };
};

const updateConfig = (existingConfig: LogConfig, targetConfig: LogConfig): LogConfig | null => {
	let modified = false;
	for (let i = 0; i < targetConfig.blocks.length; i++) {
		const targetBlock = targetConfig.blocks[i];
		const existingBlock = existingConfig.blocks.find((block) => block.name === targetBlock.name);
		if (!existingBlock) {
			console.log('[hs-client-config] [log] adding block', targetBlock.name);
			const newBlock: LogConfigBlock = {
				name: targetBlock.name,
				LogLevel: targetBlock.LogLevel,
				FilePrinting: targetBlock.FilePrinting,
				ConsolePrinting: targetBlock.ConsolePrinting,
				ScreenPrinting: targetBlock.ScreenPrinting,
				Verbose: targetBlock.Verbose,
			};
			existingConfig.blocks.push(newBlock);
			modified = true;
			continue;
		}
		modified = modified || updateConfigBlock(existingBlock, targetBlock);
	}
	return modified ? existingConfig : null;
};

const updateConfigBlock = (existingBlock: LogConfigBlock, targetBlock: LogConfigBlock): boolean => {
	if (existingBlock.LogLevel?.toLowerCase() !== targetBlock.LogLevel?.toLowerCase()) {
		console.log(
			'[hs-client-config] [log] updating block',
			existingBlock.name,
			'LogLevel',
			existingBlock.LogLevel,
			'->',
			targetBlock.LogLevel,
		);
		existingBlock.LogLevel = targetBlock.LogLevel;
		return true;
	}
	if (existingBlock.FilePrinting?.toLowerCase() !== targetBlock.FilePrinting?.toLowerCase()) {
		console.log(
			'[hs-client-config] [log] updating block',
			existingBlock.name,
			'FilePrinting',
			existingBlock.FilePrinting,
			'->',
			targetBlock.FilePrinting,
		);
		existingBlock.FilePrinting = targetBlock.FilePrinting;
		return true;
	}
	if (existingBlock.ConsolePrinting?.toLowerCase() !== targetBlock.ConsolePrinting?.toLowerCase()) {
		console.log(
			'[hs-client-config] [log] updating block',
			existingBlock.name,
			'ConsolePrinting',
			existingBlock.ConsolePrinting,
			'->',
			targetBlock.ConsolePrinting,
		);
		existingBlock.ConsolePrinting = targetBlock.ConsolePrinting;
		return true;
	}
	if (existingBlock.ScreenPrinting?.toLowerCase() !== targetBlock.ScreenPrinting?.toLowerCase()) {
		console.log(
			'[hs-client-config] [log] updating block',
			existingBlock.name,
			'ScreenPrinting',
			existingBlock.ScreenPrinting,
			'->',
			targetBlock.ScreenPrinting,
		);
		existingBlock.ScreenPrinting = targetBlock.ScreenPrinting;
		return true;
	}
	if (existingBlock.Verbose?.toLowerCase() !== targetBlock.Verbose?.toLowerCase()) {
		console.log(
			'[hs-client-config] [log] updating block',
			existingBlock.name,
			'Verbose',
			existingBlock.Verbose,
			'->',
			targetBlock.Verbose,
		);
		existingBlock.Verbose = targetBlock.Verbose;
		return true;
	}
	return false;
};

const serializeConfig = (config: LogConfig): string => {
	return config.blocks
		.map(
			(block) =>
				`[${block.name}]\n${Object.entries(block)
					.filter(([key]) => key !== 'name')
					.map(([key, value]) => `${key}=${value}`)
					.join('\n')}`,
		)
		.join('\n\n');
};

interface LogConfig {
	blocks: LogConfigBlock[];
}
interface LogConfigBlock {
	name: string;
	LogLevel: string;
	FilePrinting: string;
	ConsolePrinting: string;
	ScreenPrinting: string;
	Verbose: string;
}

import { Injectable } from '@angular/core';
import { Preferences } from '@legacy-import/src/lib/js/models/preferences';
import { GameStatusService } from '@legacy-import/src/lib/js/services/game-status.service';
import { OverwolfService } from '@legacy-import/src/lib/js/services/overwolf.service';
import { OwUtilsService } from '@legacy-import/src/lib/js/services/plugins/ow-utils.service';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { sortByProperties } from '@legacy-import/src/lib/js/services/utils';
import { ModData } from '@legacy-import/src/lib/libs/mods/services/mods-manager.service';
import { BehaviorSubject } from 'rxjs';

const MELON_LOADER_LATESTT_ZIP = 'https://github.com/LavaGang/MelonLoader/releases/download/v0.5.7/MelonLoader.x86.zip';
const MODS_MANAGER_PLUGIN_URL =
	'https://github.com/Zero-to-Heroes/firestone-melon-mods-manager/releases/latest/download/FirestoneMelonModsManager.dll';
const GAME_CONNECTOR_MOD_URL =
	'https://github.com/Zero-to-Heroes/firestone-melon-game-state-connector/releases/latest/download/GameEventsConnector.dll';

@Injectable()
export class ModsUtilsService {
	public currentModsStatus$$ = new BehaviorSubject<string>(null);

	constructor(
		private readonly ow: OverwolfService,
		private readonly io: OwUtilsService,
		private readonly gameStatus: GameStatusService,
		private readonly prefs: PreferencesService,
	) {}

	public async checkMods(installPath: string): Promise<'wrong-path' | 'installed' | 'not-installed'> {
		const files = await this.ow.listFilesInDirectory(installPath);
		if (!files.data?.some((f) => f.type === 'file' && f.name === 'Hearthstone.exe')) {
			console.warn('Not a Hearthstone directory, missing Hearthstone.exe', installPath, files);
			return 'wrong-path';
		}
		await this.updateInstallPath(installPath);
		console.debug('files in HS dir', files);
		const modsEnabled =
			files.data?.some((f) => f.type === 'dir' && f.name === 'MelonLoader') ||
			files.data?.some((f) => f.type === 'file' && f.name === 'version.dll');
		console.debug('mods enabled?', modsEnabled);
		return modsEnabled ? 'installed' : 'not-installed';
	}

	public async installedMods(installPath: string): Promise<readonly ModData[]> {
		const files = await this.ow.listFilesInDirectory(`${installPath}\\Mods`);
		const prefs = await this.prefs.getPreferences();
		const result = files.data
			?.filter((f) => f.type === 'file')
			.filter((f) => f?.name?.toLowerCase()?.endsWith('.dll'))
			.map((f) => f.name.split('.dll')[0])
			.filter((name) => name !== 'GameEventsConnector')
			.filter((name) => name !== 'FirestoneMelonModsManager')
			.map((assemblyName) => {
				return {
					AssemblyName: assemblyName,
					DownloadLink: null,
					Name: assemblyName,
					Registered: prefs.mods[assemblyName] ?? true,
					Version: null,
				};
			})
			.sort(sortByProperties((m) => [m.AssemblyName]));
		console.debug('looking for installed mods', prefs.mods, result);
		return result;
	}

	public async enableMods(
		installPath: string,
	): Promise<'game-running' | 'wrong-path' | 'installed' | 'not-installed'> {
		this.currentModsStatus$$.next('settings.general.mods.enabling-mods');
		const isGameRunning = await this.gameStatus.inGame();
		if (isGameRunning) {
			console.warn('Please close the game before disabling mods');
			this.currentModsStatus$$.next('settings.general.mods.game-running-error');
			return 'game-running';
		}
		// Should never happen, because of the checkMods validation
		if (!installPath?.includes('Hearthstone')) {
			console.warn('Trying to install a path that does not contain Hearthstone, too risky', installPath);
			this.currentModsStatus$$.next('settings.general.mods.wrong-path-error');
			return 'wrong-path';
		}
		const modsEnabled = await this.checkMods(installPath);
		if (modsEnabled === 'installed') {
			console.warn('Trying to enable mods but they are already enabled', installPath);
			return 'installed';
		}
		this.currentModsStatus$$.next('settings.general.mods.downloading-mod-engine');
		await this.io.downloadAndUnzipFile(MELON_LOADER_LATESTT_ZIP, installPath);
		this.currentModsStatus$$.next('settings.general.mods.creating-config');
		await this.createMelonConfig(installPath);
		await this.installBaseMods(installPath);

		// Copy the Managed libs
		this.currentModsStatus$$.next('settings.general.mods.refreshing-engine');
		const result = await this.refreshEngine(installPath);
		if (result === 'installed') {
			this.currentModsStatus$$.next('settings.general.mods.mods-ready');
		}

		return result;
	}

	// Copy the managed libs
	public async refreshEngine(
		installPath: string,
	): Promise<'game-running' | 'wrong-path' | 'installed' | 'not-installed'> {
		const isGameRunning = await this.gameStatus.inGame();
		if (isGameRunning) {
			console.warn('Please close the game before disabling mods');
			return 'game-running';
		}
		if (!installPath?.includes('Hearthstone')) {
			console.warn('Trying to install a path that does not contain Hearthstone, too risky', installPath);
			return 'wrong-path';
		}
		const modsEnabled = await this.checkMods(installPath);
		if (modsEnabled !== 'installed') {
			console.warn('Cannot refresh if mods are not enabled', installPath);
			return 'not-installed';
		}
		await this.io.copyFiles(`${installPath}\\MelonLoader\\Managed`, `${installPath}\\Hearthstone_Data\\Managed`);
		return 'installed';
	}

	public async disableMods(
		installPath: string,
		keepData: boolean = true,
	): Promise<'game-running' | 'wrong-path' | 'installed' | 'not-installed'> {
		const isGameRunning = await this.gameStatus.inGame();
		if (isGameRunning) {
			console.warn('Please close the game before disabling mods');
			return 'game-running';
		}
		if (!installPath?.includes('Hearthstone')) {
			console.warn('Trying to delete inside a path that does not contain Hearthstone, too risky', installPath);
			return 'wrong-path';
		}
		const modsEnabled = await this.checkMods(installPath);
		if (!modsEnabled) {
			console.warn('Trying to disable mods but they are not enabled', installPath);
			return 'not-installed';
		}
		await this.io.deleteFileOrFolder(`${installPath}\\version.dll`);
		await this.io.deleteFileOrFolder(`${installPath}\\MelonLoader`);
		if (!keepData) {
			await this.io.deleteFileOrFolder(`${installPath}\\Plugins`);
			await this.io.deleteFileOrFolder(`${installPath}\\Mods`);
			await this.io.deleteFileOrFolder(`${installPath}\\UserData`);
		}
		return 'not-installed';
	}

	private async updateInstallPath(installPath: string) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, gameInstallPath: installPath };
		await this.prefs.savePreferences(newPrefs);
	}

	private async installBaseMods(installPath: string) {
		this.ow.writeFileContents(
			`${installPath}\\Mods\\README.md`,
			`Put all your Mods DLLs here, and the libraries they depending on in UserData`,
		);
		this.ow.writeFileContents(
			`${installPath}\\UserData\\README.md`,
			`Put all the libraries your Mods depend on here`,
		);

		// Download the Mods Manager Plugin
		this.currentModsStatus$$.next('settings.general.mods.installing-mod-manager');
		this.io.downloadFileTo(MODS_MANAGER_PLUGIN_URL, `${installPath}\\Plugins`, 'FirestoneMelonModsManager.dll');

		// Download the Game Connecter Mod
		this.currentModsStatus$$.next('settings.general.mods.installing-game-connector');
		this.io.downloadFileTo(GAME_CONNECTOR_MOD_URL, `${installPath}\\Mods`, 'GameEventsConnector.dll');
	}

	private async createMelonConfig(installPath: string) {
		this.ow.writeFileContents(
			`${installPath}\\UserData\\MelonStartScreen\\Config.cfg`,
			`
	[General]
	# Toggles the Entire Start Screen  ( true | false )
	Enabled = false
	# Current Theme of the Start Screen
	Theme = "Default"
		`,
		);
	}
}

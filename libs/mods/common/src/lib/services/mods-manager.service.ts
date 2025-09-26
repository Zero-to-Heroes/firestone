import { Injectable } from '@angular/core';
import { isVersionBefore } from '@firestone/app/common';
import { GameStatusService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	OverwolfService,
	OwUtilsService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { BepInExConfig, buildBepInExConfig, updateModeVersionInBepInExConfig } from './bepin-config';

const BEPINEX_ZIP_INSTALL = 'https://static.zerotoheroes.com/mods/BepInEx_win_x86_5.4.23.3.zip';
// const MODS_MANAGER_PLUGIN_URL =
// 	'https://github.com/Zero-to-Heroes/firestone-bepinex-mods-manager/releases/latest/download/com.firestoneapp.mods.bepinex.ModsManager.dll';
// const GAME_CONNECTOR_MOD_URL =
// 	'https://github.com/Zero-to-Heroes/firestone-melon-game-state-connector/releases/latest/download/GameEventsConnector.dll';
// const GAME_CONNECTOR_FLECK_URL =
// 	'https://github.com/Zero-to-Heroes/firestone-melon-game-state-connector/releases/download/0.0.1/Fleck.dll';
const DOORSTOP_CONFIG_URL = 'https://static.zerotoheroes.com/mods/doorstop_config.ini';
const UNSTRIPPED_LIBS_BASE_URL = 'https://static.zerotoheroes.com/mods/unstripped_corlibs';
const UNSTRIPPED_LIBS = ['mscorlib.dll', 'Mono.Security.dll', 'System.Core.dll', 'System.dll', 'UniTask.dll'];

const modsLocation = 'BepInEx\\plugins';
export const configLocation = 'BepInEx\\config';

@Injectable()
export class ModsManagerService extends AbstractFacadeService<ModsManagerService> {
	public modsData$$: BehaviorSubject<readonly ModData[]>;
	public currentModsStatus$$: BehaviorSubject<string | null>;

	// private ws: WebSocket | null;

	private gameStatus: GameStatusService;
	private api: ApiRunner;
	private prefs: PreferencesService;
	private ow: OverwolfService;
	private io: OwUtilsService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ModsManagerService', () => !!this.modsData$$);
	}

	protected override assignSubjects() {
		this.modsData$$ = this.mainInstance.modsData$$;
		this.currentModsStatus$$ = this.mainInstance.currentModsStatus$$;
	}

	protected async init() {
		this.modsData$$ = new BehaviorSubject<readonly ModData[]>([]);
		this.currentModsStatus$$ = new BehaviorSubject<string | null>(null);
		this.gameStatus = AppInjector.get(GameStatusService);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);
		this.ow = AppInjector.get(OverwolfService);
		this.io = AppInjector.get(OwUtilsService);

		await waitForReady(this.prefs, this.gameStatus);

		// this.gameStatus.inGame$$.pipe(distinctUntilChanged()).subscribe(async (inGame) => {
		// 	const prefs = await this.prefs.getPreferences();
		// 	const enabled = prefs.modsEnabled;
		// 	console.debug('[mods-manager] inGame', inGame, enabled);
		// 	if (enabled && inGame) {
		// 		this.connectWebSocket();
		// 	} else {
		// 		this.disconnectWebSocket();
		// 	}
		// });

		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs.gameInstallPath),
				distinctUntilChanged(),
			)
			.subscribe(async (installPath) => {
				const installedMods = await this.installedMods(installPath);
				this.modsData$$.next(installedMods);
			});
		console.debug('[mods-manager] initialized');
	}

	public async checkMods(installPath: string): Promise<'wrong-path' | 'installed' | 'not-installed'> {
		return this.mainInstance.checkModsInternal(installPath);
	}
	private async checkModsInternal(installPath: string): Promise<'wrong-path' | 'installed' | 'not-installed'> {
		const files = await this.ow.listFilesInDirectory(installPath);
		if (!files.data?.some((f) => f.type === 'file' && f.name === 'Hearthstone.exe')) {
			console.warn('Not a Hearthstone directory, missing Hearthstone.exe', installPath, files);
			return 'wrong-path';
		}
		await this.updateInstallPath(installPath);
		console.debug('files in HS dir', files);
		let modsEnabled =
			files.data?.some((f) => f.type === 'dir' && f.name === 'BepInEx') &&
			files.data?.some((f) => f.type === 'file' && f.name === 'winhttp.dll');
		// Also check if the unstripped libs are present
		const unstrippedLibs = await this.ow.listFilesInDirectory(`${installPath}\\BepInEx\\unstripped_corlib`);
		modsEnabled = modsEnabled && unstrippedLibs.data?.length === UNSTRIPPED_LIBS.length;
		console.debug('mods enabled?', modsEnabled);
		return modsEnabled ? 'installed' : 'not-installed';
	}

	public async installedMods(installPath: string): Promise<readonly ModData[]> {
		return this.mainInstance.installedModsInternal(installPath);
	}
	private async installedModsInternal(installPath: string): Promise<readonly ModData[]> {
		// First we look into the config files
		const configFiles = await this.ow.listFilesInDirectory(`${installPath}\\${configLocation}\\`);
		console.debug('[mods-manager] configFiles', configFiles, installPath);
		const bepInExConfigs: readonly BepInExConfig[] = await Promise.all(
			configFiles.data?.map((f) =>
				buildBepInExConfig(configFiles.path + '\\' + f.name, f.name.split('.cfg')[0], this.ow),
			),
		);
		console.debug('[mods-manager] bepInExConfigs', bepInExConfigs);

		// Then we look into the plugins folder. This is only useful to remove configs that don't have a
		// corresponding plugin
		const pluginsFiles = await this.ow.listFilesInDirectory(`${installPath}\\${modsLocation}\\`);
		const uniqueFiles = pluginsFiles.data?.filter((f) => f.type === 'file').map((f) => f.name);
		const validConfigs = bepInExConfigs.filter(
			(c) =>
				uniqueFiles.includes(c.AssemblyName + '.dll') || uniqueFiles.includes(c.AssemblyName + '.dll.disabled'),
		);
		console.debug('[mods-manager] validConfigs', validConfigs);

		// TODO: check for updates
		const pluginConfigs = validConfigs.map((c) => {
			const isDisabled = uniqueFiles.includes(c.AssemblyName + '.dll.disabled');
			const result: ModData = {
				AssemblyName: c.AssemblyName,
				Name: c.Name,
				Registered: !isDisabled,
				Version: c.Version,
				DownloadLink: c.DownloadLink,
				updateAvailableVersion: null,
			};
			return result;
		});
		return pluginConfigs;
	}

	public async enableMods(
		installPath: string,
	): Promise<'game-running' | 'wrong-path' | 'installed' | 'not-installed'> {
		return this.mainInstance.enableModsInternal(installPath);
	}
	private async enableModsInternal(
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
		await this.io.downloadAndUnzipFile(BEPINEX_ZIP_INSTALL, installPath);
		this.currentModsStatus$$.next('settings.general.mods.creating-config');
		await this.createBepInExConfig(installPath);
		await this.installBaseMods(installPath);

		// Copy the Managed libs
		this.currentModsStatus$$.next('settings.general.mods.refreshing-engine');
		await this.installUnstrippedLibs(installPath);
		this.currentModsStatus$$.next('settings.general.mods.mods-ready');

		return 'installed';
	}

	public async updateMod(mod: ModData): Promise<ModData | null> {
		return this.mainInstance.updateModInternal(mod);
	}
	private async updateModInternal(mod: ModData): Promise<ModData | null> {
		console.warn('[mods-manager] updating mod not implemented yet', mod);
		const prefs = await this.prefs.getPreferences();
		const installPath = prefs.gameInstallPath;
		console.debug('[mods-manager] updating mod', mod, installPath);

		const target = mod.Registered ? `${mod.AssemblyName}.dll` : `${mod.AssemblyName}.dll.disabled`;

		const updated = await this.io.downloadFileTo(mod.DownloadLink ?? '', `${installPath}\\${modsLocation}`, target);
		console.debug('[mods-manager] mod updated', updated);
		if (!updated) {
			return null;
		}

		const newMod: ModData = { ...mod, Version: mod.updateAvailableVersion!, updateAvailableVersion: null };
		await updateModeVersionInBepInExConfig(newMod, installPath, this.ow);
		const newMods = this.modsData$$.getValue().map((m) => (m.AssemblyName === mod.AssemblyName ? newMod : m));
		this.modsData$$.next(newMods);

		return null;
	}

	public async disableMods(
		installPath: string,
		keepData: boolean = true,
	): Promise<'game-running' | 'wrong-path' | 'installed' | 'not-installed'> {
		return this.mainInstance.disableModsInternal(installPath, keepData);
	}
	private async disableModsInternal(
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
		await this.io.deleteFileOrFolder(`${installPath}\\winhttp.dll`);
		await this.io.deleteFileOrFolder(`${installPath}\\doorstop_config.ini`);
		await this.io.deleteFileOrFolder(`${installPath}\\changelog.txt`);
		await this.io.deleteFileOrFolder(`${installPath}\\.doorstop_version`);
		await this.io.deleteFileOrFolder(`${installPath}\\BepInEx`);

		// Legacy cleanup for old MelonLoader
		await this.io.deleteFileOrFolder(`${installPath}\\version.dll`);
		await this.io.deleteFileOrFolder(`${installPath}\\MelonLoader`);
		await this.io.deleteFileOrFolder(`${installPath}\\Plugins`);
		await this.io.deleteFileOrFolder(`${installPath}\\Mods`);
		await this.io.deleteFileOrFolder(`${installPath}\\UserData`);

		this.modsData$$.next([]);
		return 'not-installed';
	}

	public async toggleMods(modNames: readonly string[]) {
		return this.mainInstance.toggleModsInternal(modNames);
	}
	private async toggleModsInternal(modNames: readonly string[]) {
		const inGame = await this.gameStatus.inGame();
		if (inGame) {
			console.warn('Cannot toggle mods while in game');
			return;
		}

		const prefs = await this.prefs.getPreferences();
		const installPath = prefs.gameInstallPath;
		// Rename the DLL from .dll to .dll.disabled
		for (const modName of modNames) {
			let renamed = await this.io.renameFile(
				`${installPath}\\${modsLocation}\\${modName}.dll`,
				`${modName}.dll.disabled`,
			);
			if (!renamed) {
				renamed = await this.io.renameFile(
					`${installPath}\\${modsLocation}\\${modName}.dll.disabled`,
					`${modName}.dll`,
				);
			}
		}

		// Refresh the mods
		const installedMods = await this.installedMods(installPath);
		this.modsData$$.next(installedMods);
	}

	public async deactivateMods(modNames: readonly string[]) {
		return this.mainInstance.deactivateModsInternal(modNames);
	}
	private async deactivateModsInternal(modNames: readonly string[]) {
		console.warn('[mods-manager] deactivating mods not implemented yet', modNames);
		// const message = {
		// 	type: 'toggle-mod',
		// 	modNames: modNames,
		// 	status: 'off',
		// };
		// console.debug('[mods-manager] deactivating mods', message);
		// this.sendToWs(JSON.stringify(message));
	}

	public async hasUpdates(mod: ModData): Promise<string | null> {
		return this.mainInstance.hasUpdatesInternal(mod);
	}
	private async hasUpdatesInternal(mod: ModData): Promise<string | null> {
		const userRepo = mod.DownloadLink?.split('https://github.com/')[1];
		const apiCheckUrl = `https://api.github.com/repos/${userRepo}/releases/latest`;
		console.debug('[mods-manager] checking updates for mod', mod, userRepo, apiCheckUrl);
		const releaseDataStr = await this.api.get(apiCheckUrl);
		console.debug('[mods-manager] releaseDataStr', releaseDataStr);
		if (!releaseDataStr?.length) {
			return null;
		}

		try {
			const releaseData = JSON.parse(releaseDataStr);
			console.debug('[mods-manager] releaseData', releaseData);
			const tagName: string = releaseData.tag_name;
			console.debug('[mods-manager] tagName', tagName);
			const hasUpdate = isVersionBefore(mod.Version, tagName);
			console.debug('[mods-manager] hasUpdate', hasUpdate);
			if (hasUpdate) {
				const newMod: ModData = { ...mod, updateAvailableVersion: tagName };
				const newMods = this.modsData$$
					.getValue()
					.map((m) => (m.AssemblyName === mod.AssemblyName ? newMod : m));
				this.modsData$$.next(newMods);
			}

			return hasUpdate ? tagName : null;
		} catch (e) {
			console.warn('[mods-manager] could not parse release data', releaseDataStr);
			return null;
		}
	}

	private async installUnstrippedLibs(installPath: string) {
		for (const lib of UNSTRIPPED_LIBS) {
			await this.io.downloadFileTo(
				`${UNSTRIPPED_LIBS_BASE_URL}/${lib}`,
				`${installPath}\\BepInEx\\unstripped_corlib`,
				lib,
			);
		}
		await this.io.downloadFileTo(DOORSTOP_CONFIG_URL, `${installPath}`, 'doorstop_config.ini');
	}

	private async updateInstallPath(installPath: string) {
		const prefs = await this.prefs.getPreferences();
		if (installPath === prefs.gameInstallPath) {
			return;
		}
		const newPrefs: Preferences = { ...prefs, gameInstallPath: installPath };
		await this.prefs.savePreferences(newPrefs);
	}

	private async installBaseMods(installPath: string) {
		this.ow.writeFileContents(
			`${installPath}\\${modsLocation}\\README.md`,
			`Put all your Mods DLLs and dependencies here`,
		);
		return;

		// // Download the Mods Manager Plugin
		// this.currentModsStatus$$.next('settings.general.mods.installing-mod-manager');
		// this.io.downloadFileTo(
		// 	MODS_MANAGER_PLUGIN_URL,
		// 	`${installPath}\\${modsLocation}`,
		// 	'com.firestoneapp.mods.bepinex.ModsManager.dll',
		// );

		// // Download the Game Connecter Mod
		// // this.currentModsStatus$$.next('settings.general.mods.installing-game-connector');
		// // this.io.downloadFileTo(GAME_CONNECTOR_MOD_URL, `${installPath}\\Mods`, 'GameEventsConnector.dll');
		// // this.io.downloadFileTo(GAME_CONNECTOR_FLECK_URL, `${installPath}\\UserLibs`, 'Fleck.dll');
	}

	private async createBepInExConfig(installPath: string) {
		// 	this.ow.writeFileContents(
		// 		`${installPath}\\UserData\\MelonStartScreen\\Config.cfg`,
		// 		`
		// [General]
		// # Toggles the Entire Start Screen  ( true | false )
		// Enabled = false
		// # Current Theme of the Start Screen
		// Theme = "Default"
		// 	`,
		// 	);
	}

	// private async sendToWs(msg: string) {
	// 	console.debug('[mods-manager] waiting for websocket', this.ws);
	// 	await this.wsReady();
	// 	console.debug('[mods-manager] sending message to websocket', msg);
	// 	try {
	// 		this.ws?.send(msg);
	// 	} catch (e) {
	// 		console.warn('[mods-boostrap] could not send message to websocket', e);
	// 	}
	// }

	// private wsReady(): Promise<void> {
	// 	return new Promise<void>((resolve) => {
	// 		const dbWait = () => {
	// 			if (this.ws?.readyState === this.ws?.OPEN) {
	// 				resolve();
	// 			} else {
	// 				setTimeout(() => dbWait(), 150);
	// 			}
	// 		};
	// 		dbWait();
	// 	});
	// }

	// private async connectWebSocket() {
	// 	console.log('[mods-manager] connecting');
	// 	if (!!this.ws && this.ws.readyState === this.ws?.OPEN) {
	// 		// console.debug('[mods-manager] websocket already open');
	// 		return;
	// 	}
	// 	let retriesLeft = 30;
	// 	while (retriesLeft >= 0) {
	// 		try {
	// 			this.ws = new WebSocket('ws://127.0.0.1:9977/firestone-mods-manager');
	// 			this.ws.addEventListener('message', (msgEvent) => {
	// 				const messageData: ModMessage<readonly ModData[]> = JSON.parse(msgEvent.data);
	// 				console.debug('[mods-manager] received message', messageData);
	// 				if (messageData?.type === 'mods-info') {
	// 					this.internalModsData$$.next(
	// 						messageData.data
	// 							?.filter((d) => d.AssemblyName !== 'com.firestoneapp.mods.bepinex.ModsManager')
	// 							?.filter((d) => d.AssemblyName !== 'GameEventsConnector') ?? [],
	// 					);
	// 				}
	// 			});
	// 			console.log('[mods-manager] WS client created');
	// 			return;
	// 		} catch (e) {
	// 			console.debug('[mods-manager] could not connect to websocket, retrying', e);
	// 			retriesLeft--;
	// 		}
	// 		await sleep(2000);
	// 	}
	// }

	// private async disconnectWebSocket() {
	// 	console.log('[mods-manager] discconnecting');
	// 	this.ws?.close();
	// 	this.ws = null;
	// 	// So that it doesn't conflict with the data from the config
	// 	this.internalModsData$$.next([]);
	// }
}

interface ModMessage<T> {
	readonly type: 'mods-info';
	readonly data: T;
}

export interface ModData {
	readonly Name: string;
	readonly Registered: boolean;
	readonly AssemblyName: string;
	readonly Version: string;
	readonly DownloadLink: string | null;
	readonly updateAvailableVersion: string | null;
}

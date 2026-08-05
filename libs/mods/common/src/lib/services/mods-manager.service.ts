import { Injectable } from '@angular/core';
import type { LogFileBackend } from '@firestone/shared/common/service';
import {
	GameStatusService,
	LOG_FILE_BACKEND,
	NotificationsService,
	Preferences,
	PreferencesService,
} from '@firestone/shared/common/service';
import { Mutable, sortByProperties } from '@firestone/shared/framework/common';
import type { IOwUtilsService } from '@firestone/shared/framework/core';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	ILocalizationService,
	OW_UTILS_SERVICE_TOKEN,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import {
	DEFAULT_MODS_ENGINE_CONFIG,
	DOORSTOP_CONFIG_INI,
	MODS_ENGINE_REVISION,
	MODS_ENGINE_REVISION_STAMP,
	ModsEngineArch,
	ModsEngineConfig,
	ModsRemoteConfig,
} from '../model/mods-engine-config';
import { getPeMachineArchFromBuffer, PeMachineArch } from '../utils/pe-machine-type';
import {
	BepInExConfig,
	buildBepInExConfig,
	createInitialConfigFile,
	updateModeVersionInBepInExConfig,
} from './bepin-config';

// Built in mods-backend lambda
// Bump ?v= when trustedMods schema / engine blocks change.
const MODS_CONFIG_URL = 'https://static.zerotoheroes.com/mods/mods-config.json?v=10';

const modsLocation = 'BepInEx\\plugins';
export const configLocation = 'BepInEx\\config';

export type ModsCheckStatus = 'wrong-path' | 'installed' | 'not-installed' | 'engine-mismatch';

@Injectable()
export class ModsManagerService extends AbstractFacadeService<ModsManagerService> {
	public modsData$$: BehaviorSubject<readonly ModData[]>;
	public currentModsStatus$$: BehaviorSubject<string | null>;

	// private ws: WebSocket | null;

	private gameStatus: GameStatusService;
	private api: ApiRunner;
	private prefs: PreferencesService;
	private fileBackend: LogFileBackend;
	private io: IOwUtilsService;
	private notifications: NotificationsService;
	private i18n: ILocalizationService;

	private modsConfig: ModsRemoteConfig | null = null;
	private migrationInProgress = false;
	private pendingEngineMigration = false;

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
		this.fileBackend = AppInjector.get(LOG_FILE_BACKEND);
		this.io = AppInjector.get(OW_UTILS_SERVICE_TOKEN);
		this.notifications = AppInjector.get(NotificationsService);
		this.i18n = AppInjector.get(ILocalizationService);

		await waitForReady(this.prefs, this.gameStatus);

		const remoteConfig = await this.api.callGetApi<Partial<ModsRemoteConfig>>(MODS_CONFIG_URL);
		this.modsConfig = {
			engine: remoteConfig?.engine ?? DEFAULT_MODS_ENGINE_CONFIG,
			trustedMods: remoteConfig?.trustedMods ?? [],
		};
		console.debug('[mods-manager] modsConfig', this.modsConfig);

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
				filter((installPath) => !!installPath),
				distinctUntilChanged(),
			)
			.subscribe(async (installPath) => {
				const refreshedMods = await this.refreshModsInternal(installPath);
				this.modsData$$.next(refreshedMods);
				await this.maybeAutoMigrateEngine(installPath);
				await this.maybeRefreshEngineRevision(installPath);
				await this.maybeRepairMissingCorlibs(installPath);
			});

		// Auto-update mods when game exits or when app launches and game is not running
		this.gameStatus.inGame$$
			.pipe(
				filter((inGame) => inGame !== null),
				distinctUntilChanged(),
			)
			.subscribe(async (inGame) => {
				if (!inGame) {
					await this.autoUpdateModsIfNeeded();
					const prefs = await this.prefs.getPreferences();
					if (prefs.modsEnabled && prefs.gameInstallPath) {
						// Arch mismatch and/or engine revision — both may need a full reinstall.
						await this.maybeAutoMigrateEngine(prefs.gameInstallPath);
						await this.maybeRefreshEngineRevision(prefs.gameInstallPath);
					}
				}
			});

		const prefs = await this.prefs.getPreferences();
		if (prefs.gameInstallPath && prefs.modsEnabled) {
			await this.maybeAutoMigrateEngine(prefs.gameInstallPath);
			await this.maybeRefreshEngineRevision(prefs.gameInstallPath);
			await this.maybeRepairMissingCorlibs(prefs.gameInstallPath);
		}

		console.debug('[mods-manager] initialized');
	}

	protected override initElectronSubjects(): void {
		this.setupElectronSubject(this.modsData$$, 'ModsManagerService-modsData');
		this.setupElectronSubject(this.currentModsStatus$$, 'ModsManagerService-currentModsStatus');
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('checkModsInternal', (installPath: string) =>
			this.checkModsInternal(installPath),
		);
		this.registerMainProcessMethod('installedModsInternal', (installPath: string) =>
			this.installedModsInternal(installPath),
		);
		this.registerMainProcessMethod('enableModsInternal', (installPath: string) =>
			this.enableModsInternal(installPath),
		);
		this.registerMainProcessMethod('updateModInternal', (mod: ModData) => this.updateModInternal(mod));
		this.registerMainProcessMethod('disableModsInternal', (installPath: string, keepData: boolean = true) =>
			this.disableModsInternal(installPath, keepData),
		);
		this.registerMainProcessMethod('toggleModsInternal', (mods: readonly ModData[]) =>
			this.toggleModsInternal(mods),
		);
		this.registerMainProcessMethod('deactivateModsInternal', (modNames: readonly string[]) =>
			this.deactivateModsInternal(modNames),
		);
		this.registerMainProcessMethod('hasUpdatesInternal', (mod: ModData) => this.hasUpdatesInternal(mod));
	}

	public async checkMods(installPath: string): Promise<ModsCheckStatus> {
		return this.callOnMainProcess<ModsCheckStatus>('checkModsInternal', installPath);
	}
	private async checkModsInternal(installPath: string): Promise<ModsCheckStatus> {
		const files = await this.fileBackend.listFilesInDirectory(installPath);
		if (!files?.data?.some((f) => f.type === 'file' && f.name === 'Hearthstone.exe')) {
			console.warn('Not a Hearthstone directory, missing Hearthstone.exe', installPath, files);
			return 'wrong-path';
		}
		await this.updateInstallPath(installPath);
		console.debug('files in HS dir', files);
		const hasBepInEx = files?.data?.some((f) => f.type === 'dir' && f.name === 'BepInEx');
		const hasWinhttp = files?.data?.some((f) => f.type === 'file' && f.name === 'winhttp.dll');
		if (!hasBepInEx || !hasWinhttp) {
			console.debug('mods not installed', hasBepInEx, hasWinhttp);
			return 'not-installed';
		}

		const hasCorlibs = await this.hasUnstrippedCorlibs(installPath);
		if (!hasCorlibs) {
			console.debug('mods missing unstripped corlibs');
			return 'not-installed';
		}

		const requiredArch = await this.getRequiredEngineArch(installPath);
		const installedArch = await this.getInstalledEngineArch(installPath);
		if (requiredArch && installedArch && requiredArch !== installedArch) {
			console.warn('[mods-manager] engine architecture mismatch', requiredArch, installedArch);
			return 'engine-mismatch';
		}

		console.debug('mods enabled?', true);
		return 'installed';
	}

	public async installedMods(installPath: string): Promise<readonly ModData[]> {
		return this.callOnMainProcess<readonly ModData[]>('installedModsInternal', installPath);
	}
	private async installedModsInternal(installPath: string): Promise<readonly ModData[]> {
		// First we look into the config files
		const configFiles = await this.fileBackend.listFilesInDirectory(`${installPath}\\${configLocation}\\`);
		console.debug('[mods-manager] configFiles', configFiles, installPath);
		const bepInExConfigs: readonly BepInExConfig[] = await Promise.all(
			configFiles?.data?.map((f) =>
				buildBepInExConfig(
					(configFiles?.path ?? '') + '\\' + f.name,
					f.name.split('.cfg')[0],
					this.fileBackend,
				),
			) ?? [],
		);
		console.debug('[mods-manager] bepInExConfigs', bepInExConfigs);
		// console.log('[mods-manager] bepInExConfigs', bepInExConfigs.length);

		// Then we look into the plugins folder. This is only useful to remove configs that don't have a
		// corresponding plugin
		const pluginsFiles = await this.fileBackend.listFilesInDirectory(`${installPath}\\${modsLocation}\\`);
		const uniqueFiles = pluginsFiles?.data?.filter((f) => f.type === 'file').map((f) => f.name) ?? [];
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
				lastTrustedVersion: c.Version,
				DownloadLink: c.DownloadLink,
				Description: c.Description ?? null,
				updateAvailableVersion: null,
				alreadyInstalled: true,
			};
			return result;
		});
		return pluginConfigs;
	}

	private async refreshModsInternal(installPath: string): Promise<readonly ModData[]> {
		const installedMods = await this.installedMods(installPath);
		console.log(
			'[mods-manager] installedMods 0',
			installedMods?.map((m) => m.AssemblyName),
		);
		const allMods = [...(this.modsConfig?.trustedMods ?? [])];
		console.log(
			'[mods-manager] allMods',
			allMods?.map((m) => m.AssemblyName),
		);
		for (const mod of installedMods) {
			const existing: Mutable<ModData> | undefined = allMods.find((m) => m.AssemblyName === mod.AssemblyName);
			if (!existing) {
				allMods.push(mod);
			} else {
				existing.Version = mod.Version;
				existing.Registered = mod.Registered;
				existing.updateAvailableVersion = mod.updateAvailableVersion;
				existing.DownloadLink = mod.DownloadLink;
				existing.Name = mod.Name;
				existing.Description = existing.Description ?? mod.Description;
				existing.alreadyInstalled = true;
			}
		}
		const finalMods = allMods.sort(sortByProperties((m) => [m.Name]));
		console.log(
			'[mods-manager] finalMods',
			finalMods?.map((m) => m.AssemblyName),
		);
		return finalMods;
	}

	public async enableMods(
		installPath: string,
	): Promise<'game-running' | 'wrong-path' | 'installed' | 'not-installed' | 'engine-mismatch'> {
		return this.callOnMainProcess<
			'game-running' | 'wrong-path' | 'installed' | 'not-installed' | 'engine-mismatch'
		>('enableModsInternal', installPath);
	}
	private async enableModsInternal(
		installPath: string,
	): Promise<'game-running' | 'wrong-path' | 'installed' | 'not-installed' | 'engine-mismatch'> {
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
		const modsStatus = await this.checkModsInternal(installPath);
		if (modsStatus === 'engine-mismatch') {
			const migrated = await this.migrateEngineInternal(installPath);
			return migrated ? 'installed' : 'engine-mismatch';
		}
		if (modsStatus === 'installed') {
			console.warn('Trying to enable mods but they are already enabled', installPath);
			return 'installed';
		}
		const requiredArch = await this.getRequiredEngineArch(installPath);
		if (!requiredArch) {
			console.warn('[mods-manager] could not detect game architecture', installPath);
			this.currentModsStatus$$.next('settings.general.mods.wrong-path-error');
			return 'wrong-path';
		}
		await this.installEngine(installPath, requiredArch);
		this.currentModsStatus$$.next('settings.general.mods.mods-ready');

		return 'installed';
	}

	public async updateMod(mod: ModData): Promise<ModData | null> {
		return this.callOnMainProcess<ModData | null>('updateModInternal', mod);
	}
	private async updateModInternal(mod: ModData): Promise<ModData | null> {
		const prefs = await this.prefs.getPreferences();
		const installPath = prefs.gameInstallPath;
		if (!installPath) {
			console.warn('[mods-manager] No install path found', prefs.gameInstallPath);
			return null;
		}
		console.debug('[mods-manager] updating mod', mod, installPath);
		if (!mod.DownloadLink) {
			console.error('[mods-manager] Mod has no download link', mod);
			return null;
		}

		const target = mod.Registered ? `${mod.AssemblyName}.dll` : `${mod.AssemblyName}.dll.disabled`;

		const apiLink = mod.DownloadLink.replace('https://github.com/', 'https://api.github.com/repos/');
		console.debug('[mods-manager] apiLink', apiLink);
		const latestRelease = await this.api.callGetApi<{ tag_name: string }>(`${apiLink}/releases/latest`);
		if (!latestRelease) {
			console.warn('[mods-manager] Could not get latest release', mod.DownloadLink);
			return null;
		}
		const latestVersion = latestRelease.tag_name;
		console.debug('[mods-manager] latest version', latestVersion, latestRelease);
		const dllDownloadLink = `${mod.DownloadLink}/releases/latest/download/${mod.AssemblyName}.dll`;
		const updated = await this.io.downloadFileTo(dllDownloadLink, `${installPath}\\${modsLocation}`, target);
		console.debug('[mods-manager] mod updated', updated);
		if (!updated) {
			return null;
		}

		const wasAlreadyInstalled = mod.alreadyInstalled;
		const newMod: ModData = {
			...mod,
			Version: mod.updateAvailableVersion ?? latestVersion,
			updateAvailableVersion: null,
			alreadyInstalled: true,
		};
		if (wasAlreadyInstalled) {
			console.debug('[mods-manager] updating config file', newMod, installPath);
			await updateModeVersionInBepInExConfig(newMod, installPath, this.fileBackend);
		} else {
			console.debug('[mods-manager] creating config file', newMod, installPath);
			await createInitialConfigFile(newMod, installPath, this.fileBackend);
		}
		console.log('[mods-manager] updating mod', newMod);
		const newMods = this.modsData$$.getValue().map((m) => (m.AssemblyName === mod.AssemblyName ? newMod : m));
		console.log(
			'[mods-manager] newMods',
			newMods?.map((m) => m.AssemblyName),
		);
		this.modsData$$.next(newMods);

		return null;
	}

	public async disableMods(
		installPath: string,
		keepData: boolean = true,
	): Promise<'game-running' | 'wrong-path' | 'installed' | 'not-installed'> {
		return this.callOnMainProcess<'game-running' | 'wrong-path' | 'installed' | 'not-installed'>(
			'disableModsInternal',
			installPath,
			keepData,
		);
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
		const modsEnabled = await this.checkModsInternal(installPath);
		if (modsEnabled === 'not-installed' || modsEnabled === 'wrong-path') {
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

		console.log('[mods-manager] disabling mods');
		this.modsData$$.next([]);
		return 'not-installed';
	}

	public async toggleMods(mods: readonly ModData[]) {
		return this.mainInstance.toggleModsInternal(mods);
	}
	private async toggleModsInternal(mods: readonly ModData[]) {
		const inGame = await this.gameStatus.inGame();
		if (inGame) {
			console.warn('Cannot toggle mods while in game');
			return;
		}

		const prefs = await this.prefs.getPreferences();
		const installPath = prefs.gameInstallPath;
		if (!installPath) {
			console.warn('[mods-manager] No install path found', prefs.gameInstallPath);
			return;
		}
		// Rename the DLL from .dll to .dll.disabled
		for (const mod of mods) {
			console.debug('[mods-manager] toggling mod', mod);
			// Mod was disabled
			if (mod.alreadyInstalled) {
				const modName = mod.AssemblyName;
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
			// We need to download the mod
			else {
				console.debug('[mods-manager] downloading mod', mod);
				await this.updateModInternal({ ...mod, Registered: true });
			}
		}

		// Refresh the mods
		const installedMods = await this.refreshModsInternal(installPath);
		this.modsData$$.next(installedMods);
	}

	public async hasReplayViewer(): Promise<boolean> {
		return this.callOnMainProcess<boolean>('hasReplayViewerInternal');
	}
	private async hasReplayViewerInternal(): Promise<boolean> {
		const prefs = await this.prefs.getPreferences();
		const installPath = prefs.gameInstallPath;
		if (!installPath) {
			console.warn('[mods-manager] No install path found');
			return false;
		}
		const mods = await this.installedMods(installPath);
		return mods.some((m) => m.AssemblyName === 'com.firestoneapp.mods.bepinex.ReplayViewer');
	}

	public async deactivateMods(modNames: readonly string[]) {
		return this.callOnMainProcess('deactivateModsInternal', modNames);
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
		return this.callOnMainProcess<string | null>('hasUpdatesInternal', mod);
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
				console.log(
					'[mods-manager] newMods after update check',
					newMods?.map((m) => m.AssemblyName),
				);
				this.modsData$$.next(newMods);
			}

			return hasUpdate ? tagName : null;
		} catch (e) {
			console.warn('[mods-manager] could not parse release data', releaseDataStr);
			return null;
		}
	}

	private async autoUpdateModsIfNeeded(): Promise<void> {
		const prefs = await this.prefs.getPreferences();
		if (!prefs.modsEnabled || !prefs.modsAutoUpdate) {
			console.debug(
				'[mods-manager] auto-update skipped, modsEnabled:',
				prefs.modsEnabled,
				'modsAutoUpdate:',
				prefs.modsAutoUpdate,
			);
			return;
		}

		const installPath = prefs.gameInstallPath;
		if (!installPath) {
			return;
		}

		const modsStatus = await this.checkModsInternal(installPath);
		if (modsStatus !== 'installed' && modsStatus !== 'engine-mismatch') {
			return;
		}

		console.log('[mods-manager] checking for auto-updates');
		const mods = this.modsData$$.getValue();
		const modsWithDownloadLinks = mods.filter((m) => !!m.DownloadLink && m.alreadyInstalled);
		for (const mod of modsWithDownloadLinks) {
			const newVersion = await this.hasUpdates(mod);
			if (newVersion) {
				console.log('[mods-manager] auto-updating mod', mod.Name, 'to', newVersion);
				await this.updateMod({ ...mod, updateAvailableVersion: newVersion });
			}
		}
		console.log('[mods-manager] auto-update check complete');
	}

	private async installUnstrippedLibs(installPath: string, baseUrl: string) {
		const engineConfig = this.getEngineConfig();
		for (const lib of engineConfig.unstrippedLibs) {
			await this.io.downloadFileTo(`${baseUrl}/${lib}`, `${installPath}\\BepInEx\\unstripped_corlib`, lib);
		}
		await this.writeDoorstopConfig(installPath);
	}

	private async writeDoorstopConfig(installPath: string): Promise<void> {
		await this.fileBackend.writeFileContents(`${installPath}\\doorstop_config.ini`, DOORSTOP_CONFIG_INI);
	}

	private engineRevisionStampPath(installPath: string): string {
		return `${installPath}\\BepInEx\\unstripped_corlib\\${MODS_ENGINE_REVISION_STAMP}`;
	}

	private async writeEngineRevisionStamp(installPath: string): Promise<void> {
		await this.fileBackend.writeFileContents(
			this.engineRevisionStampPath(installPath),
			String(MODS_ENGINE_REVISION),
		);
	}

	private async readEngineRevisionStamp(installPath: string): Promise<number | null> {
		const stampPath = this.engineRevisionStampPath(installPath);
		if (!(await this.fileBackend.fileExists(stampPath))) {
			return null;
		}
		const raw = (await this.fileBackend.readTextFile(stampPath))?.trim();
		const parsed = raw ? Number.parseInt(raw, 10) : NaN;
		return Number.isFinite(parsed) ? parsed : null;
	}

	private async hasUnstrippedCorlibs(installPath: string): Promise<boolean> {
		const engineConfig = this.getEngineConfig();
		const unstrippedLibs = await this.fileBackend.listFilesInDirectory(
			`${installPath}\\BepInEx\\unstripped_corlib`,
		);
		const present = new Set(unstrippedLibs?.data?.map((f) => f.name.toLowerCase()) ?? []);
		return engineConfig.unstrippedLibs.every((lib) => present.has(lib.toLowerCase()));
	}

	/**
	 * Full BepInEx reinstall when MODS_ENGINE_REVISION advances (e.g. Unity 6000.3 / x64 Doorstop).
	 * Corlib-only refresh is not enough: wrong-arch winhttp.dll never injects, so LogOutput stays stale.
	 */
	private async maybeRefreshEngineRevision(installPath: string): Promise<void> {
		const prefs = await this.prefs.getPreferences();
		if (!prefs.modsEnabled || !installPath || this.migrationInProgress) {
			return;
		}
		const isGameRunning = await this.gameStatus.inGame();
		if (isGameRunning) {
			this.pendingEngineMigration = true;
			return;
		}
		const files = await this.fileBackend.listFilesInDirectory(installPath);
		const hasBepInEx = files?.data?.some((f) => f.type === 'dir' && f.name === 'BepInEx');
		const hasWinhttp = files?.data?.some((f) => f.type === 'file' && f.name === 'winhttp.dll');
		if (!hasBepInEx || !hasWinhttp) {
			return;
		}
		const installedRev = await this.readEngineRevisionStamp(installPath);
		if (installedRev === MODS_ENGINE_REVISION) {
			return;
		}
		console.log('[mods-manager] full engine reinstall for revision', installedRev, '->', MODS_ENGINE_REVISION);
		await this.migrateEngineInternal(installPath);
	}

	private async maybeRepairMissingCorlibs(installPath: string): Promise<void> {
		const prefs = await this.prefs.getPreferences();
		if (!prefs.modsEnabled || !installPath || this.migrationInProgress) {
			return;
		}
		const files = await this.fileBackend.listFilesInDirectory(installPath);
		const hasBepInEx = files?.data?.some((f) => f.type === 'dir' && f.name === 'BepInEx');
		const hasWinhttp = files?.data?.some((f) => f.type === 'file' && f.name === 'winhttp.dll');
		if (!hasBepInEx || !hasWinhttp || (await this.hasUnstrippedCorlibs(installPath))) {
			return;
		}
		const requiredArch = await this.getRequiredEngineArch(installPath);
		const installedArch = await this.getInstalledEngineArch(installPath);
		if (!requiredArch || !installedArch || requiredArch !== installedArch) {
			return;
		}
		console.log('[mods-manager] repairing missing unstripped corlibs');
		const archConfig = this.getEngineConfig()[requiredArch];
		await this.installUnstrippedLibs(installPath, archConfig.unstrippedCorlibsBaseUrl);
	}

	private getEngineConfig(): ModsEngineConfig {
		return this.modsConfig?.engine ?? DEFAULT_MODS_ENGINE_CONFIG;
	}

	private async getPeArchFromFile(filePath: string): Promise<PeMachineArch | null> {
		const head = await this.fileBackend.readBinaryFileHead(filePath, 512);
		if (!head?.length) {
			return null;
		}
		return getPeMachineArchFromBuffer(head);
	}

	private async getRequiredEngineArch(installPath: string): Promise<ModsEngineArch | null> {
		return this.getPeArchFromFile(`${installPath}\\Hearthstone.exe`);
	}

	private async getInstalledEngineArch(installPath: string): Promise<ModsEngineArch | null> {
		const winhttpPath = `${installPath}\\winhttp.dll`;
		if (await this.fileBackend.fileExists(winhttpPath)) {
			const arch = await this.getPeArchFromFile(winhttpPath);
			if (arch) {
				return arch;
			}
		}
		return this.getPeArchFromFile(`${installPath}\\BepInEx\\core\\BepInEx.Preloader.dll`);
	}

	private async maybeAutoMigrateEngine(installPath: string): Promise<void> {
		const prefs = await this.prefs.getPreferences();
		if (!prefs.modsEnabled || !installPath) {
			return;
		}
		const status = await this.checkModsInternal(installPath);
		if (status !== 'engine-mismatch') {
			this.pendingEngineMigration = false;
			return;
		}
		await this.migrateEngineInternal(installPath);
	}

	private async migrateEngineInternal(installPath: string): Promise<boolean> {
		if (this.migrationInProgress) {
			console.debug('[mods-manager] engine migration already in progress');
			return false;
		}
		const requiredArch = await this.getRequiredEngineArch(installPath);
		if (!requiredArch) {
			console.warn('[mods-manager] cannot migrate engine, unknown game architecture');
			return false;
		}

		this.migrationInProgress = true;
		this.pendingEngineMigration = false;
		await this.notifyEngineMigrationStart();

		try {
			this.currentModsStatus$$.next('settings.general.mods.migrating-engine');
			const installedMods = await this.installedModsInternal(installPath);
			const removed = await this.removeEngineFiles(installPath);
			if (!removed) {
				this.pendingEngineMigration = true;
				await this.notifyEngineMigrationRetry();
				return false;
			}

			await this.installEngine(installPath, requiredArch);

			this.currentModsStatus$$.next('settings.general.mods.reinstalling-mods');
			for (const mod of installedMods) {
				if (!mod.DownloadLink) {
					continue;
				}
				await this.updateModInternal({ ...mod, Registered: mod.Registered });
			}

			const refreshedMods = await this.refreshModsInternal(installPath);
			this.modsData$$.next(refreshedMods);
			this.currentModsStatus$$.next('settings.general.mods.mods-ready');
			await this.notifyEngineMigrationDone();
			return true;
		} catch (e) {
			console.error('[mods-manager] engine migration failed', e);
			this.pendingEngineMigration = true;
			await this.notifyEngineMigrationRetry();
			return false;
		} finally {
			this.migrationInProgress = false;
		}
	}

	private async installEngine(installPath: string, arch: ModsEngineArch): Promise<void> {
		const engineConfig = this.getEngineConfig();
		const archConfig = engineConfig[arch];
		this.currentModsStatus$$.next('settings.general.mods.downloading-mod-engine');
		await this.io.downloadAndUnzipFile(archConfig.bepInExZip, installPath);
		this.currentModsStatus$$.next('settings.general.mods.creating-config');
		await this.createBepInExConfig(installPath);
		await this.installBaseMods(installPath);
		this.currentModsStatus$$.next('settings.general.mods.refreshing-engine');
		await this.installUnstrippedLibs(installPath, archConfig.unstrippedCorlibsBaseUrl);
		await this.writeEngineRevisionStamp(installPath);
	}

	private async removeEngineFiles(installPath: string): Promise<boolean> {
		try {
			await this.io.deleteFileOrFolder(`${installPath}\\winhttp.dll`);
			await this.io.deleteFileOrFolder(`${installPath}\\doorstop_config.ini`);
			await this.io.deleteFileOrFolder(`${installPath}\\changelog.txt`);
			await this.io.deleteFileOrFolder(`${installPath}\\.doorstop_version`);
			await this.io.deleteFileOrFolder(`${installPath}\\BepInEx`);
			const stillHasBepInEx = await this.fileBackend.fileExists(`${installPath}\\BepInEx`);
			const stillHasWinhttp = await this.fileBackend.fileExists(`${installPath}\\winhttp.dll`);
			if (stillHasBepInEx || stillHasWinhttp) {
				console.warn(
					'[mods-manager] engine files still present after delete',
					stillHasBepInEx,
					stillHasWinhttp,
				);
				return false;
			}
			return true;
		} catch (e) {
			console.warn('[mods-manager] could not remove engine files', e);
			return false;
		}
	}

	private async notifyEngineMigrationStart(): Promise<void> {
		const title = this.i18n.translateString('settings.general.mods.engine-migration-start-title');
		const text = this.i18n.translateString('settings.general.mods.engine-migration-start-message');
		this.notifications.notifyInfo(title, text, 'mods-engine-migration-start', true);
	}

	private async notifyEngineMigrationDone(): Promise<void> {
		const title = this.i18n.translateString('settings.general.mods.engine-migration-done-title');
		const text = this.i18n.translateString('settings.general.mods.engine-migration-done-message');
		this.notifications.notifyInfo(title, text, 'mods-engine-migration-done', true);
	}

	private async notifyEngineMigrationRetry(): Promise<void> {
		const title = this.i18n.translateString('settings.general.mods.engine-migration-retry-title');
		const text = this.i18n.translateString('settings.general.mods.engine-migration-retry-message');
		this.notifications.notifyInfo(title, text, 'mods-engine-migration-retry', true);
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
		await this.fileBackend.writeFileContents(
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
	/** Tooltip text in mods settings; from mods-config.json trustedMods or BepInEx plugin .cfg. */
	readonly Description?: string | null;
	readonly updateAvailableVersion: string | null;
	readonly alreadyInstalled: boolean;
	readonly lastTrustedVersion: string | null;
}

const isVersionBefore = (appVersion: string, reference: string): boolean => {
	const appValue = buildAppValue(appVersion);
	const referenceValue = buildAppValue(reference);
	return appValue < referenceValue;
};

const buildAppValue = (appVersion: string): number => {
	appVersion = appVersion.replace('v', '');
	const [major, minor, patch] = appVersion.split('.').map((info) => parseInt(info));
	return 1000 * major + 100 * minor + patch;
};

import { Injectable } from '@angular/core';
import {
	AddonHostState,
	AddonManifest,
	getAddonsRootPath,
	InstalledAddon,
	joinPath,
	parseAddonManifest,
} from '@firestone/addons/common';
import type { LogFileBackend } from '@firestone/shared/common/service';
import { LOG_FILE_BACKEND } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	FILE_SYSTEM_UI_SERVICE_TOKEN,
	IFileSystemUIService,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

const HOST_STATE_STORAGE_KEY = 'firestone-addons-host-state';

const EMPTY_HOST_STATE: AddonHostState = {
	enabledById: {},
	settingsById: {},
};

const ADDONS_FOLDER_README = `Drop Firestone add-on folders here.

Each add-on must be a folder containing:
  - manifest.json
  - main.js (or the file named in manifest.main)

Example:
  %APPDATA%\\Firestone\\Addons\\bobs-rush\\manifest.json
  %APPDATA%\\Firestone\\Addons\\bobs-rush\\main.js

Then open Firestone Settings → Add-ons, click Refresh, and enable the add-on.

Add-ons persist here across Firestone and Overwolf updates.
`;

@Injectable()
export class AddonsInstallService extends AbstractFacadeService<AddonsInstallService> {
	public addons$$: BehaviorSubject<readonly InstalledAddon[]>;
	public rootPath$$: BehaviorSubject<string>;
	public hostState$$: BehaviorSubject<AddonHostState>;

	private fileBackend: LogFileBackend;
	private localStorage: LocalStorageService;
	private fileSystemUi: IFileSystemUIService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'AddonsInstallService', () => !!this.addons$$);
	}

	protected override assignSubjects() {
		this.addons$$ = this.mainInstance.addons$$;
		this.rootPath$$ = this.mainInstance.rootPath$$;
		this.hostState$$ = this.mainInstance.hostState$$;
	}

	protected async init() {
		this.addons$$ = new BehaviorSubject<readonly InstalledAddon[]>([]);
		this.rootPath$$ = new BehaviorSubject<string>(getAddonsRootPath());
		this.hostState$$ = new BehaviorSubject<AddonHostState>(EMPTY_HOST_STATE);
		this.fileBackend = AppInjector.get(LOG_FILE_BACKEND);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.fileSystemUi = AppInjector.get(FILE_SYSTEM_UI_SERVICE_TOKEN);

		const stored = this.localStorage.getItem<AddonHostState>(HOST_STATE_STORAGE_KEY);
		if (stored) {
			this.hostState$$.next({
				enabledById: stored.enabledById ?? {},
				settingsById: stored.settingsById ?? {},
			});
		}

		await this.ensureAddonsFolder();
		await this.refreshAddonsInternal();
	}

	protected override initElectronSubjects(): void {
		this.setupElectronSubject(this.addons$$, 'AddonsInstallService-addons');
		this.setupElectronSubject(this.rootPath$$, 'AddonsInstallService-rootPath');
		this.setupElectronSubject(this.hostState$$, 'AddonsInstallService-hostState');
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('refreshAddonsInternal', () => this.refreshAddonsInternal());
		this.registerMainProcessMethod('setAddonEnabledInternal', (addonId: string, enabled: boolean) =>
			this.setAddonEnabledInternal(addonId, enabled),
		);
		this.registerMainProcessMethod(
			'setAddonSettingInternal',
			(addonId: string, key: string, value: boolean | string | number) =>
				this.setAddonSettingInternal(addonId, key, value),
		);
		this.registerMainProcessMethod('openAddonsFolderInternal', () => this.openAddonsFolderInternal());
	}

	public async refreshAddons(): Promise<readonly InstalledAddon[]> {
		return this.callOnMainProcess<readonly InstalledAddon[]>('refreshAddonsInternal');
	}

	public async setAddonEnabled(addonId: string, enabled: boolean): Promise<void> {
		return this.callOnMainProcess<void>('setAddonEnabledInternal', addonId, enabled);
	}

	public async setAddonSetting(addonId: string, key: string, value: boolean | string | number): Promise<void> {
		return this.callOnMainProcess<void>('setAddonSettingInternal', addonId, key, value);
	}

	public async openAddonsFolder(): Promise<void> {
		return this.callOnMainProcess<void>('openAddonsFolderInternal');
	}

	public getRootPath(): string {
		return this.rootPath$$?.value ?? getAddonsRootPath();
	}

	public getHostState(): AddonHostState {
		return this.hostState$$?.value ?? EMPTY_HOST_STATE;
	}

	public getMergedSettings(manifest: AddonManifest): { [key: string]: boolean | string | number } {
		const stored = this.getHostState().settingsById[manifest.id] ?? {};
		const result: { [key: string]: boolean | string | number } = {};
		for (const setting of manifest.settings ?? []) {
			const value = stored[setting.key];
			result[setting.key] = value !== undefined ? value : (setting.default as any);
		}
		return result;
	}

	private async refreshAddonsInternal(): Promise<readonly InstalledAddon[]> {
		await this.ensureAddonsFolder();
		const root = this.getRootPath();
		const listing = await this.fileBackend.listFilesInDirectory(root);
		const dirs = (listing?.data ?? []).filter((e) => e.type === 'dir');
		const hostState = this.getHostState();
		const addons: InstalledAddon[] = [];

		for (const dir of dirs) {
			const folderPath = joinPath(root, dir.name);
			const manifestPath = joinPath(folderPath, 'manifest.json');
			const exists = await this.fileBackend.fileExists(manifestPath);
			if (!exists) {
				continue;
			}
			try {
				const rawText = await this.fileBackend.readTextFile(manifestPath);
				const rawJson = JSON.parse(rawText);
				const manifest = parseAddonManifest(rawJson, dir.name);
				if (!manifest) {
					addons.push({
						manifest: {
							id: dir.name,
							name: dir.name,
							version: '0.0.0',
							main: 'main.js',
							permissions: [],
						},
						folderPath,
						mainPath: joinPath(folderPath, 'main.js'),
						enabled: false,
						loadError: 'Invalid manifest.json',
					});
					continue;
				}
				const mainPath = joinPath(folderPath, manifest.main);
				const mainExists = await this.fileBackend.fileExists(mainPath);
				const enabledDefault = hostState.enabledById[manifest.id];
				addons.push({
					manifest,
					folderPath,
					mainPath,
					enabled: enabledDefault === true,
					loadError: mainExists ? null : `Missing main file: ${manifest.main}`,
				});
			} catch (e) {
				console.warn('[addons] failed to read add-on', dir.name, e);
				addons.push({
					manifest: {
						id: dir.name,
						name: dir.name,
						version: '0.0.0',
						main: 'main.js',
						permissions: [],
					},
					folderPath,
					mainPath: joinPath(folderPath, 'main.js'),
					enabled: false,
					loadError: e instanceof Error ? e.message : String(e),
				});
			}
		}

		addons.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
		this.addons$$.next(addons);
		console.log(
			'[addons] scanned',
			addons.length,
			'add-on(s) in',
			root,
			addons.map((a) => `${a.manifest.id}:${a.enabled ? 'on' : 'off'}`),
		);
		return addons;
	}

	private async setAddonEnabledInternal(addonId: string, enabled: boolean): Promise<void> {
		const next: AddonHostState = {
			...this.getHostState(),
			enabledById: {
				...this.getHostState().enabledById,
				[addonId]: enabled,
			},
		};
		this.persistHostState(next);
		await this.refreshAddonsInternal();
	}

	private async setAddonSettingInternal(
		addonId: string,
		key: string,
		value: boolean | string | number,
	): Promise<void> {
		const current = this.getHostState();
		const next: AddonHostState = {
			...current,
			settingsById: {
				...current.settingsById,
				[addonId]: {
					...(current.settingsById[addonId] ?? {}),
					[key]: value,
				},
			},
		};
		this.persistHostState(next);
		this.addons$$.next(this.addons$$.value.map((a) => ({ ...a })));
	}

	private async openAddonsFolderInternal(): Promise<void> {
		await this.ensureAddonsFolder();
		const root = this.getRootPath();
		const result = await this.fileSystemUi.openPath(root);
		if (!result.success) {
			console.warn('[addons] could not open add-ons folder', root, result.error);
		}
	}

	private persistHostState(state: AddonHostState): void {
		this.hostState$$.next(state);
		this.localStorage.setItem(HOST_STATE_STORAGE_KEY, state);
	}

	private async ensureAddonsFolder(): Promise<void> {
		const root = getAddonsRootPath();
		this.rootPath$$.next(root);

		const listing = await this.fileBackend.listFilesInDirectory(root);
		const folderExists = !!listing?.success;
		const readmePath = joinPath(root, 'README.txt');
		const readmeExists = folderExists ? await this.fileBackend.fileExists(readmePath) : false;

		if (!folderExists || !readmeExists) {
			// Writing the README creates intermediate directories when missing (Electron mkdir;
			// Overwolf writeFileContents similarly creates the path).
			const written = await this.fileBackend.writeFileContents(readmePath, ADDONS_FOLDER_README);
			if (!written) {
				console.error('[addons] failed to create add-ons folder at', root);
				return;
			}
			console.log('[addons] created add-ons folder at', root);
		}
	}
}

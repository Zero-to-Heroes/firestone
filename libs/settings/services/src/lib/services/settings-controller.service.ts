import { Injectable } from '@angular/core';
import {
	EXCLUDE_FROM_PORTABLE_SETTINGS,
	FORCE_LOCAL_PROP,
	LOG_FILE_BACKEND,
	type LogFileBackend,
	Preferences,
	PreferencesService,
} from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	WindowHandlerFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SettingsControllerService extends AbstractFacadeService<SettingsControllerService> {
	public selectedNodeId$$: BehaviorSubject<string | null>;
	public searchString$$: BehaviorSubject<string | null>;
	public showNewOnly$$: BehaviorSubject<boolean>;

	private prefs: PreferencesService;
	private fileBackend: LogFileBackend;
	private windowHandler: WindowHandlerFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'SettingsControllerService', () => !!this.selectedNodeId$$);
	}

	protected override assignSubjects() {
		this.selectedNodeId$$ = this.mainInstance.selectedNodeId$$;
		this.searchString$$ = this.mainInstance.searchString$$;
		this.showNewOnly$$ = this.mainInstance.showNewOnly$$;
	}

	protected async init() {
		this.selectedNodeId$$ = new BehaviorSubject<string | null>(null);
		this.searchString$$ = new BehaviorSubject<string | null>(null);
		this.showNewOnly$$ = new BehaviorSubject<boolean>(false);

		this.prefs = AppInjector.get(PreferencesService);
		this.fileBackend = AppInjector.get(LOG_FILE_BACKEND);
		this.windowHandler = AppInjector.get(WindowHandlerFacadeService);
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('exportSettingsInternal', () => this.exportSettingsInternal());
		this.registerMainProcessMethod('importSettingsInternal', (filePath: string) =>
			this.importSettingsInternal(filePath),
		);
		this.registerMainProcessMethod('selectNodeIdInternal', (nodeId: string | null) =>
			this.selectNodeIdInternal(nodeId),
		);
		this.registerMainProcessMethod('selectNodeFromOutsideInternal', (nodeId: string | null) =>
			this.selectNodeFromOutsideInternal(nodeId),
		);
		this.registerMainProcessMethod('newSearchStringInternal', (searchString: string) =>
			this.newSearchStringInternal(searchString),
		);
		this.registerMainProcessMethod('setShowNewOnlyInternal', (showNewOnly: boolean) =>
			this.setShowNewOnlyInternal(showNewOnly),
		);
		this.registerMainProcessMethod('openLocalCacheFolderInternal', () => this.openLocalCacheFolderInternal());
		this.registerMainProcessMethod('openAppFilePickerInternal', () => this.openAppFilePickerInternal());
		this.registerMainProcessMethod('reloadWindowsInternal', () => this.reloadWindowsInternal());
		this.registerMainProcessMethod('relaunchAppInternal', () => this.relaunchAppInternal());
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.selectedNodeId$$ = new BehaviorSubject<string | null>(null);
		this.searchString$$ = new BehaviorSubject<string | null>(null);
		this.showNewOnly$$ = new BehaviorSubject<boolean>(false);
	}

	protected override initElectronSubjects() {
		this.setupElectronSubject(this.selectedNodeId$$, 'settings-controller-selected-node-id');
		this.setupElectronSubject(this.searchString$$, 'settings-controller-search-string');
		this.setupElectronSubject(this.showNewOnly$$, 'settings-controller-show-new-only');
	}

	public selectNodeId(nodeId: string | null) {
		this.callOnMainProcess('selectNodeIdInternal', nodeId);
	}
	private selectNodeIdInternal(nodeId: string | null) {
		this.selectedNodeId$$.next(nodeId);
	}

	public selectNodeFromOutside(nodeId: string | null) {
		this.callOnMainProcess('selectNodeFromOutsideInternal', nodeId);
	}
	private selectNodeFromOutsideInternal(nodeId: string | null) {
		this.selectedNodeId$$.next(nodeId);
		this.searchString$$.next(null);
	}

	public setShowNewOnly(showNewOnly: boolean) {
		this.callOnMainProcess('setShowNewOnlyInternal', showNewOnly);
	}
	private setShowNewOnlyInternal(showNewOnly: boolean) {
		this.showNewOnly$$.next(showNewOnly);
	}

	public newSearchString(searchString: string) {
		this.callOnMainProcess('newSearchStringInternal', searchString);
	}
	private newSearchStringInternal(searchString: string) {
		this.searchString$$.next(searchString);
	}

	public async exportSettings() {
		await this.callOnMainProcess('exportSettingsInternal');
	}
	private async exportSettingsInternal() {
		const prefs = await this.prefs.getPreferences();
		const prefsToBeSaved: Partial<Preferences> = { ...prefs };
		const prefsForMetaData = new Preferences();
		Object.keys(prefsToBeSaved).forEach((prop) => {
			if (this.excludeKeyFromPortableSettings(prop, prefsForMetaData)) {
				delete prefsToBeSaved[prop];
			}
		});
		this.stripNestedPortableUserFields(prefsToBeSaved as Record<string, unknown>);
		const prefsAsString = JSON.stringify(prefsToBeSaved, null, 4);
		await this.fileBackend.deleteAppFile('settings.json');
		await this.fileBackend.storeAppFile('settings.json', prefsAsString);
	}

	public async importSettings(filePath: string) {
		await this.callOnMainProcess('importSettingsInternal', filePath);
	}
	private async importSettingsInternal(filePath: string) {
		const prefsAsString = await this.fileBackend.readTextFile(filePath);
		const prefs = JSON.parse(prefsAsString);
		const prefsForCheck = new Preferences();
		Object.keys(prefs).forEach((prop) => {
			if (this.excludeKeyFromPortableSettings(prop, prefsForCheck)) {
				delete prefs[prop];
			}
		});
		this.stripNestedPortableUserFields(prefs as Record<string, unknown>);
		const existingPrefs: Preferences = await this.prefs.getPreferences();
		const prefsToSave = { ...existingPrefs, ...prefs };
		await this.prefs.savePreferences(prefsToSave);
	}

	public async openLocalCacheFolder() {
		await this.callOnMainProcess('openLocalCacheFolderInternal');
	}
	private async openLocalCacheFolderInternal() {
		await this.fileBackend.openLocalCacheFolder();
	}

	public async openAppFilePicker(): Promise<string | undefined> {
		return await this.callOnMainProcess('openAppFilePickerInternal');
	}
	private async openAppFilePickerInternal(): Promise<string | undefined> {
		return await this.fileBackend.openAppFilePicker();
	}

	public async reloadWindows() {
		await this.callOnMainProcess('reloadWindowsInternal');
	}
	private async reloadWindowsInternal() {
		this.windowHandler.reloadWindows();
		await this.windowHandler.reloadWindows();
	}

	public async relaunchApp() {
		await this.callOnMainProcess('relaunchAppInternal');
	}
	private async relaunchAppInternal() {
		this.windowHandler.relaunchApp();
	}

	private excludeKeyFromPortableSettings(prop: string, prefsTemplate: Preferences): boolean {
		return (
			prop.endsWith('Position') ||
			!!Reflect.getMetadata(FORCE_LOCAL_PROP, prefsTemplate, prop) ||
			!!Reflect.getMetadata(EXCLUDE_FROM_PORTABLE_SETTINGS, prefsTemplate, prop)
		);
	}

	/** Nested user-defined labels (no per-field reflect metadata on `Preferences`). */
	private stripNestedPortableUserFields(prefs: Record<string, unknown>): void {
		const groups = prefs['constructedDeckVersions'];
		if (!Array.isArray(groups)) {
			return;
		}
		for (const group of groups) {
			if (group && typeof group === 'object' && group !== null && 'groupName' in group) {
				delete (group as { groupName?: unknown }).groupName;
			}
		}
	}
}

import { Injectable } from '@angular/core';
import {
	FORCE_LOCAL_PROP,
	LOG_FILE_BACKEND,
	LogFileBackend,
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

	private prefs: PreferencesService;
	private fileBackend: LogFileBackend;
	private windowHandler: WindowHandlerFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'SettingsControllerService', () => !!this.selectedNodeId$$);
	}

	protected override assignSubjects() {
		this.selectedNodeId$$ = this.mainInstance.selectedNodeId$$;
		this.searchString$$ = this.mainInstance.searchString$$;
	}

	protected async init() {
		this.selectedNodeId$$ = new BehaviorSubject<string | null>(null);
		this.searchString$$ = new BehaviorSubject<string | null>(null);

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
		this.registerMainProcessMethod('openLocalCacheFolderInternal', () => this.openLocalCacheFolderInternal());
		this.registerMainProcessMethod('openAppFilePickerInternal', () => this.openAppFilePickerInternal());
		this.registerMainProcessMethod('reloadWindowsInternal', () => this.reloadWindowsInternal());
		this.registerMainProcessMethod('relaunchAppInternal', () => this.relaunchAppInternal());
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.selectedNodeId$$ = new BehaviorSubject<string | null>(null);
		this.searchString$$ = new BehaviorSubject<string | null>(null);
	}

	protected override initElectronSubjects() {
		this.setupElectronSubject(this.selectedNodeId$$, 'settings-controller-selected-node-id');
		this.setupElectronSubject(this.searchString$$, 'settings-controller-search-string');
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
		// Remove all the properties that end with "Position" or that are annotated with
		// @Reflect.metadata(FORCE_LOCAL_PROP, true)
		Object.keys(prefsToBeSaved).forEach((prop) => {
			if (prop.endsWith('Position') || Reflect.getMetadata(FORCE_LOCAL_PROP, prefsForMetaData, prop)) {
				delete prefsToBeSaved[prop];
			}
		});
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
		// Now update the prefs with the new ones, excluding the ones with FORCE_LOCAL_PROP metadata
		// Also exclude the "position" properties
		Object.keys(prefs).forEach((prop) => {
			if (Reflect.getMetadata(FORCE_LOCAL_PROP, existingPrefs, prop) || prop.endsWith('Position')) {
				delete prefs[prop];
			}
		});
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
}

import { Injectable } from '@angular/core';
import { FORCE_LOCAL_PROP, Preferences, PreferencesService } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { SettingNode } from '../models/settings.types';

@Injectable()
export class SettingsControllerService extends AbstractFacadeService<SettingsControllerService> {
	public rootNode$$: BehaviorSubject<SettingNode | null>;
	// public selectedNode$$: BehaviorSubject<SettingNode | null>;
	public selectedNodeId$$: BehaviorSubject<string | null>;
	public searchString$$: BehaviorSubject<string | null>;

	private prefs: PreferencesService;
	private ow: OverwolfService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'SettingsControllerService', () => !!this.rootNode$$);
	}

	protected override assignSubjects() {
		this.rootNode$$ = this.mainInstance.rootNode$$;
		// this.selectedNode$$ = this.mainInstance.selectedNode$$;
		this.selectedNodeId$$ = this.mainInstance.selectedNodeId$$;
		this.searchString$$ = this.mainInstance.searchString$$;
	}

	protected async init() {
		this.rootNode$$ = new BehaviorSubject<SettingNode | null>(null);
		// this.selectedNode$$ = new BehaviorSubject<SettingNode | null>(null);
		this.selectedNodeId$$ = new BehaviorSubject<string | null>(null);
		this.searchString$$ = new BehaviorSubject<string | null>(null);

		this.prefs = AppInjector.get(PreferencesService);
		this.ow = AppInjector.get(OverwolfService);
	}

	public setRootNode(node: SettingNode) {
		this.rootNode$$.next(node);
	}

	public selectNodeId(nodeId: string | null) {
		this.selectedNodeId$$.next(nodeId);
	}

	public selectNodeFromOutside(nodeId: string | null) {
		this.selectedNodeId$$.next(nodeId);
		this.searchString$$.next(null);
	}

	public newSearchString(searchString: string) {
		this.searchString$$.next(searchString);
	}

	public async exportSettings() {
		this.mainInstance.exportSettingsInternal();
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
		await this.ow.deleteAppFile('settings.json');
		await this.ow.storeAppFile('settings.json', prefsAsString);
	}

	public async importSettings(filePath: string) {
		this.mainInstance.importSettingsInternal(filePath);
	}
	private async importSettingsInternal(filePath: string) {
		const prefsAsString = await this.ow.readTextFile(filePath);
		const prefs = JSON.parse(prefsAsString);
		await this.prefs.savePreferences(prefs);
	}
}

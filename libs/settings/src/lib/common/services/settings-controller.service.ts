import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { SettingNode } from '../models/settings.types';

@Injectable()
export class SettingsControllerService extends AbstractFacadeService<SettingsControllerService> {
	public selectedNode$$: BehaviorSubject<SettingNode | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'SettingsControllerService', () => !!this.selectedNode$$);
	}

	protected override assignSubjects() {
		this.selectedNode$$ = this.mainInstance.selectedNode$$;
	}

	protected async init() {
		this.selectedNode$$ = new BehaviorSubject<SettingNode | null>(null);
	}

	public selectNode(node: SettingNode) {
		this.selectedNode$$.next(node);
	}
}

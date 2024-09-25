import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { SettingNode } from '../models/settings.types';

@Injectable()
export class SettingsControllerService extends AbstractFacadeService<SettingsControllerService> {
	public rootNode$$: BehaviorSubject<SettingNode | null>;
	// public selectedNode$$: BehaviorSubject<SettingNode | null>;
	public selectedNodeId$$: BehaviorSubject<string | null>;
	public searchString$$: BehaviorSubject<string | null>;

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
	}

	public setRootNode(node: SettingNode) {
		this.rootNode$$.next(node);
	}

	// public selectNode(node: SettingNode) {
	// 	this.selectedNode$$.next(node);
	// }

	public selectNodeId(nodeId: string | null) {
		console.debug('selecting node id', nodeId, this.rootNode$$.value);
		this.selectedNodeId$$.next(nodeId);
		this.searchString$$.next(null);
	}

	public newSearchString(searchString: string) {
		this.searchString$$.next(searchString);
	}
}

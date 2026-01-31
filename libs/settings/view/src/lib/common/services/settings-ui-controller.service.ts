import { Injectable } from '@angular/core';
import { SettingNode } from '@firestone/settings/services';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SettingsUiControllerService {
	public rootNode$$: BehaviorSubject<SettingNode | null> = new BehaviorSubject<SettingNode | null>(null);

	public setRootNode(node: SettingNode) {
		this.rootNode$$.next(node);
	}
}

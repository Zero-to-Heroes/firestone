import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	IRegionInfoService,
	RegionInfoResult,
	isMainProcess,
	WindowManagerService,
} from '@firestone/shared/framework/core';

@Injectable({ providedIn: 'root' })
export class ElectronRegionInfoFacadeService
	extends AbstractFacadeService<ElectronRegionInfoFacadeService>
	implements IRegionInfoService
{
	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ElectronRegionInfoFacadeService', () => true);
	}

	protected override assignSubjects(): void {}
	protected async init(): Promise<void> {}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('getRegionInfo', () => this.buildRegionInfo());
	}

	protected override createElectronProxy(_ipcRenderer: unknown): void {}
	protected override initElectronSubjects(): void {}

	public async getRegionInfo(): Promise<RegionInfoResult> {
		if (this.isElectronContext && !isMainProcess()) {
			return this.callOnMainProcess('getRegionInfo');
		}
		return this.buildRegionInfo();
	}

	private buildRegionInfo(): RegionInfoResult {
		const { app } = require('electron');
		const locale = app.getLocale();
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return {
			success: true,
			region: locale?.split('-')[0] ?? 'US',
			country: locale?.split('-')[1] ?? 'US',
			language: locale ?? 'en-US',
			timezone: timeZone,
		};
	}
}

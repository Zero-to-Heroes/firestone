import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	IMonitorsService,
	MonitorsListResult,
	isMainProcess,
	WindowManagerService,
} from '@firestone/shared/framework/core';

@Injectable({ providedIn: 'root' })
export class ElectronMonitorsFacadeService
	extends AbstractFacadeService<ElectronMonitorsFacadeService>
	implements IMonitorsService
{
	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ElectronMonitorsFacadeService', () => true);
	}

	protected override assignSubjects(): void {}
	protected async init(): Promise<void> {}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('getMonitorsList', () => this.buildMonitorsList());
	}

	protected override createElectronProxy(_ipcRenderer: unknown): void {}
	protected override initElectronSubjects(): void {}

	public async getMonitorsList(): Promise<MonitorsListResult> {
		if (this.isElectronContext && !isMainProcess()) {
			return this.callOnMainProcess('getMonitorsList');
		}
		return this.buildMonitorsList();
	}

	private buildMonitorsList(): MonitorsListResult {
		const { screen } = require('electron');
		const displays = screen.getAllDisplays();
		return {
			displays: displays.map((d: any) => ({
				id: d.id,
				handle: { value: d.id },
				name: d.label,
				physicalWidth: d.size.width,
				physicalHeight: d.size.height,
				width: d.bounds.width,
				height: d.bounds.height,
				x: d.bounds.x,
				y: d.bounds.y,
				scaleFactor: d.scaleFactor,
			})),
		};
	}
}

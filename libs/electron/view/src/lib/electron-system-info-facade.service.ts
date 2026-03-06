import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	ISystemInfoService,
	SystemInfo,
	isMainProcess,
	WindowManagerService,
} from '@firestone/shared/framework/core';

@Injectable({ providedIn: 'root' })
export class ElectronSystemInfoFacadeService
	extends AbstractFacadeService<ElectronSystemInfoFacadeService>
	implements ISystemInfoService
{
	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ElectronSystemInfoFacadeService', () => true);
	}

	protected override assignSubjects(): void {}
	protected async init(): Promise<void> {}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('getSystemInformation', () => this.buildSystemInfo());
	}

	protected override createElectronProxy(_ipcRenderer: unknown): void {}
	protected override initElectronSubjects(): void {}

	public async getSystemInformation(): Promise<SystemInfo | null> {
		if (this.isElectronContext && !isMainProcess()) {
			return this.callOnMainProcess('getSystemInformation');
		}
		return this.buildSystemInfo();
	}

	private buildSystemInfo(): SystemInfo {
		const os = require('os');
		const cpus = os.cpus();
		const totalMem = os.totalmem();
		const freeMem = os.freemem();
		return {
			PhysicalCPUCount: cpus.length,
			LogicalCPUCount: cpus.length,
			CPUMaxSpeed: cpus[0]?.speed ?? 0,
			PhysicalMemoryTotal: totalMem,
			PhysicalMemoryFree: freeMem,
			OSVersion: os.release(),
			OSBuild: os.release(),
			ComputerName: os.hostname(),
			SystemLanguage: Intl.DateTimeFormat().resolvedOptions().locale,
		};
	}
}

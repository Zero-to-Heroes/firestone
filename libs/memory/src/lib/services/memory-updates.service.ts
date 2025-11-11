import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { MemoryUpdate } from '../models/memory-update';

const eventName = 'memory-updates-changed';

@Injectable()
export class MemoryUpdatesService extends AbstractFacadeService<MemoryUpdatesService> {
	public memoryUpdates$$: BehaviorSubject<MemoryUpdate>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'MemoryUpdatesService', () => !!this.memoryUpdates$$);
	}

	protected override assignSubjects() {
		this.memoryUpdates$$ = this.mainInstance.memoryUpdates$$;
	}

	protected override init() {
		this.memoryUpdates$$ = new BehaviorSubject<MemoryUpdate>({} as MemoryUpdate);
	}

	newUpdate(changes: MemoryUpdate) {
		// console.debug('[memory-updates] new update', changes);
		this.memoryUpdates$$.next(changes);
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.memoryUpdates$$, eventName);
	}

	// In renderer process
	protected override async createElectronProxy(ipcRenderer: any) {
		// In renderer process, create proxy subjects that communicate with main process via IPC
		this.memoryUpdates$$ = new BehaviorSubject<MemoryUpdate>({} as MemoryUpdate);
	}
}

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
		console.debug('[memory-updates] new update', changes);
		this.memoryUpdates$$.next(changes);
	}

	protected override async setupElectronMainProcessHandlers() {
		// Use eval to prevent bundler from trying to include electron in frontend builds
		const { ipcMain } = eval('require')('electron');
		// Handle IPC requests from renderer processes
		ipcMain.handle(eventName, async () => {
			return this.memoryUpdates$$.getValue();
		});
		// Broadcast changes to all renderer processes
		const originalNext = this.memoryUpdates$$.next.bind(this.memoryUpdates$$);
		this.memoryUpdates$$.next = (value: MemoryUpdate) => {
			originalNext(value);
			this.broadcastToRenderers(eventName, value);
		};
	}

	// In renderer process
	protected override async createElectronProxy() {
		// In renderer process, create proxy subjects that communicate with main process via IPC
		this.memoryUpdates$$ = new BehaviorSubject<MemoryUpdate>({} as MemoryUpdate);

		console.debug('[memory-updates] creating Electron proxy in renderer process');
		// Listen for game status changes from main process
		const { ipcRenderer } = (window as any).require('electron');
		if (ipcRenderer) {
			ipcRenderer.on(eventName, (_, update: MemoryUpdate) => {
				this.memoryUpdates$$.next(update);
			});
		}
	}
}

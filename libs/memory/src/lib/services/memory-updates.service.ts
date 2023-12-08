import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MemoryUpdate } from '../models/memory-update';

@Injectable()
export class MemoryUpdatesService {
	public memoryUpdates$$ = new BehaviorSubject<MemoryUpdate>({} as MemoryUpdate);

	newUpdate(changes: MemoryUpdate) {
		this.memoryUpdates$$.next(changes);
	}
}

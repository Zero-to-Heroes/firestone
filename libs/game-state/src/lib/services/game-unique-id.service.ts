import { Injectable } from '@angular/core';
import { MemoryInspectionService } from '@firestone/memory';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class GameUniqueIdService {
	public uniqueId$$ = new BehaviorSubject<string | null>(null);

	constructor(private readonly memory: MemoryInspectionService) {}

	public async onNewGame() {
		const uniqueId = await this.memory.getGameUniqueId();
		console.log('[game-unique-id] uniqueId', uniqueId);
		this.uniqueId$$.next(uniqueId);
	}
}

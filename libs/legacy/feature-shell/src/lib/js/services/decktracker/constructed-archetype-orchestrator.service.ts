import { EventEmitter, Injectable } from '@angular/core';
import { ConstructedArchetypeService } from '@firestone/constructed/common';
import { sleep } from '@firestone/shared/framework/common';
import { GameStateEvent } from '../../models/decktracker/game-state-event';
import { GameEvent } from '../../models/game-event';
import { ArchetypeCategorizationEvent } from './event-parser/archetype-categorization-parser';

@Injectable()
export class ConstructedArchetypeServiceOrchestrator {
	private deckUpdater: EventEmitter<GameEvent | GameStateEvent>;

	constructor(private service: ConstructedArchetypeService) {}

	private async init() {
		while (this.deckUpdater == null) {
			this.deckUpdater = window['deckUpdater'];
			await sleep(100);
		}
	}

	public async triggerArchetypeCategorization(deckstring: string) {
		// TODO: check premium tier / uses left in free tier
		await this.init();
		const archetypeId = await this.service.getArchetypeForDeck(deckstring);
		this.deckUpdater.next({
			type: ArchetypeCategorizationEvent.EVENT_NAME,
			archetypeId: archetypeId,
		} as GameStateEvent);
	}
}

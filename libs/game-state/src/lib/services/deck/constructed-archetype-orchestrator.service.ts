import { Injectable } from '@angular/core';
import { GameEvent } from '../game-events/game-event';
import { GameEventsEmitterService } from '../game-events/game-events-emitter.service';
import { ConstructedArchetypeService } from './constructed-archetype.service';

@Injectable()
export class ConstructedArchetypeServiceOrchestrator {
	constructor(
		private service: ConstructedArchetypeService,
		private gameEventsEmitter: GameEventsEmitterService,
	) {}

	public async triggerArchetypeCategorization(deckstring: string) {
		// TODO: check premium tier / uses left in free tier
		const archetypeId = await this.service.getArchetypeForDeck(deckstring);
		console.log('[mulligan-guide] triggering archetype categorization for deckstring', deckstring, archetypeId);
		this.gameEventsEmitter.allEvents.next(
			Object.assign(new GameEvent(), {
				type: GameEvent.ARCHETYPE_CATEGORIZATION,
				additionalData: {
					archetypeId: archetypeId,
				},
			} as GameEvent),
		);
	}
}

import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DamageGameEvent } from '../../../models/mainwindow/game-events/damage-game-event';
import { LotteryState } from '../lottery.model';
import { LotteryProcessor } from './_processor';

export class LotteryDamageWithSpellsProcessor implements LotteryProcessor {
	constructor(private readonly allCards: CardsFacadeService) {}

	process(currentState: LotteryState, event: DamageGameEvent): LotteryState {
		if (!currentState.shouldTrack) {
			// console.debug('[lottery] not tracking, ignoring event', event);
			return currentState;
		}
		const localPlayerId = event.localPlayer?.PlayerId;
		const damageSourceController = event.additionalData?.sourceControllerId;
		console.debug('[lottery] damage with spells source controller', localPlayerId, damageSourceController);
		if (localPlayerId && localPlayerId !== damageSourceController) {
			return currentState;
		}

		const sourceCardId = event.additionalData.sourceCardId;
		const sourceCard = this.allCards.getCard(sourceCardId);
		console.debug('[lottery] damage with spells source card', sourceCardId, sourceCard.type, sourceCard);
		if (!sourceCard?.id) {
			return currentState;
		}

		if (sourceCard.type !== 'Spell') {
			return currentState;
		}

		const damageDealt = Object.values(event.additionalData.targets)
			.map((target) => target.Damage)
			.reduce((sum, current) => sum + current, 0);
		console.debug('[lottery] damage with spells damage dealt', damageDealt, currentState.damageWithSpells);

		return currentState.update({
			damageWithSpells: currentState.damageWithSpells + damageDealt,
		});
	}
}

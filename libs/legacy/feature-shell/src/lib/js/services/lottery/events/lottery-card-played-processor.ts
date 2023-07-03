import { Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LotteryState } from '../lottery.model';
import { LotteryProcessor } from './_processor';

export class LotteryCardPlayedProcessor implements LotteryProcessor {
	constructor(private readonly allCards: CardsFacadeService) {}

	process(currentState: LotteryState, event: GameEvent): LotteryState {
		if (!currentState.shouldTrack) {
			console.debug('[lottery] not tracking, ignoring event', event);
			return currentState;
		}

		const [cardId, controllerId, localPlayer] = event.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		if (!isPlayer) {
			return currentState;
		}

		const isQuilboar = this.allCards.getCard(cardId).races?.includes(Race[Race.QUILBOAR]);
		const isSpell = this.allCards.getCard(cardId).type === 'Spell';

		return currentState.update({
			quilboarsPlayed: isQuilboar ? currentState.quilboarsPlayed + 1 : currentState.quilboarsPlayed,
			spellsPlayed: isSpell ? currentState.spellsPlayed + 1 : currentState.spellsPlayed,
		});
	}
}

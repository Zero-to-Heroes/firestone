import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameEvent } from '../../../../../models/game-event';
import { defaultStartingHp } from '../../../../hs-utils';
import { normalizeHeroCardId } from '../../../bgs-utils';
import { RealTimeStatsState } from '../real-time-stats';
import { EventParser } from './_event-parser';

export class RTStatHpOverTurnParser implements EventParser {
	constructor(private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.DAMAGE;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const targets = Object.keys(gameEvent.additionalData.targets)
			.filter(cardId => this.allCards.getCard(cardId)?.type === 'Hero')
			.map(cardId => ({
				hero: normalizeHeroCardId(cardId),
				value: gameEvent.additionalData.targets[cardId].Damage,
			}));
		if (!targets?.length) {
			return currentState;
		}

		const hpOverTurn = currentState.hpOverTurn;
		for (const target of targets) {
			if (target.hero === CardIds.NonCollectible.Neutral.KelthuzadTavernBrawl2) {
				continue;
			}
			const currentHps = hpOverTurn[target.hero] ?? [];
			const currentInfo = currentHps.find(info => info.turn === currentState.currentTurn) ?? {
				turn: currentState.currentTurn,
				value: defaultStartingHp(currentState.gameType, target.hero),
			};
			const newHps = [
				...currentHps.filter(info => info.turn !== currentState.currentTurn),
				{
					turn: currentState.currentTurn,
					value: Math.max(0, currentInfo.value - target.value),
				} as NumericTurnInfo,
			];
			hpOverTurn[target.hero] = newHps;
		}

		return currentState.update({
			hpOverTurn: hpOverTurn,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatHpOverTurnParser';
	}
}

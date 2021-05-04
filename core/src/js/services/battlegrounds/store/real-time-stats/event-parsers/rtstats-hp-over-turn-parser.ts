import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameEvent } from '../../../../../models/game-event';
import { DamageGameEvent } from '../../../../../models/mainwindow/game-events/damage-game-event';
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
		gameEvent: DamageGameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const targets = Object.values(gameEvent.additionalData.targets)
			.filter((target) => this.allCards.getCard(target.TargetCardId)?.type === 'Hero')
			.map((target) => ({
				hero: normalizeHeroCardId(target.TargetCardId),
				value: target.Damage,
			}));
		if (!targets?.length) {
			return currentState;
		}

		const hpOverTurn = currentState.hpOverTurn;
		for (const target of targets) {
			if (
				[
					CardIds.NonCollectible.Neutral.KelthuzadTavernBrawl2,
					CardIds.NonCollectible.Neutral.BaconphheroTavernBrawl,
				].includes(target.hero)
			) {
				continue;
			}
			const currentHps = hpOverTurn[target.hero] ?? [];
			const currentInfo = currentHps.find((info) => info.turn === currentState.currentTurn) ?? {
				turn: currentState.currentTurn,
				value: defaultStartingHp(currentState.gameType, target.hero),
			};
			const newHps = [
				...currentHps.filter((info) => info.turn !== currentState.currentTurn),
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

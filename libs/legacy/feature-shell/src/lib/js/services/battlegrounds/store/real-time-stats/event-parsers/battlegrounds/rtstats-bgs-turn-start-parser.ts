import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../../../models/game-event';
import { normalizeHeroCardId } from '../../../../bgs-utils';
import { HpTurnInfo, RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatBgsTurnStartParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return (
			gameEvent.type === GameEvent.BATTLEGROUNDS_RECRUIT_PHASE ||
			gameEvent.type === GameEvent.BATTLEGROUNDS_COMBAT_START
		);
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const heroesFromGame: readonly Hero[] = gameEvent.additionalData.heroes;
		const newCurrentTurn = Math.ceil(gameEvent.additionalData.turnNumber / 2);
		const hpOverTurn = currentState.hpOverTurn;
		for (const hero of Object.keys(hpOverTurn)) {
			const normalizedHero = normalizeHeroCardId(hero, this.allCards);
			const existingStats = hpOverTurn[normalizedHero];
			// This is just for the first turn, when opponents are not revealed yet
			// We shouldn't even get to that safeguard, since opponents aren't added
			// to the history, but it's just in case the order of events get
			// somehow mixed up
			if (!existingStats?.length) {
				continue;
			}

			const { currentHp, currentArmor } = this.getHpForHero(normalizedHero, heroesFromGame);
			const newStats: readonly HpTurnInfo[] = [
				...existingStats.filter((stat) => stat.turn !== newCurrentTurn),
				{
					turn: newCurrentTurn,
					value: currentHp ?? 0,
					armor: currentArmor ?? 0,
				},
			];
			hpOverTurn[normalizedHero] = newStats;
		}

		return currentState.update({
			hpOverTurn: hpOverTurn,
		} as RealTimeStatsState);
	}

	private getHpForHero(heroCardId: string, heroes: readonly Hero[]): { currentHp: number; currentArmor: number } {
		const hero = heroes.find(
			(h) => normalizeHeroCardId(h.CardId, this.allCards) === normalizeHeroCardId(heroCardId, this.allCards),
		);
		if (!hero) {
			console.warn(
				'could not find hero',
				heroCardId,
				heroes.map((h) => h.CardId),
			);
		}
		return {
			currentHp: hero?.Health,
			currentArmor: hero?.Armor,
		};
	}

	name(): string {
		return 'RTStatBgsTurnStartParser';
	}
}

interface Hero {
	readonly CardId: string;
	readonly EntityId: number;
	readonly Health: number;
	readonly Armor: number;
}

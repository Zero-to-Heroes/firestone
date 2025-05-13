import { Injectable } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { Events } from '../../../events.service';
import { EventParser } from './event-parsers/_event-parser';
import { RTStatBgsAttackFirstParser } from './event-parsers/battlegrounds/rtstats-bgs-attack-first-parser';
import { RTStatsBgsBattleHistoryUpdatedParser } from './event-parsers/battlegrounds/rtstats-bgs-battle-history-updated-parser';
import { RTStatsBgsBoardStatsParser } from './event-parsers/battlegrounds/rtstats-bgs-board-stats-parser';
import { RTStatBgsEnemyHeroKilledParser } from './event-parsers/battlegrounds/rtstats-bgs-enemy-hero-killed-parser';
import { RTStatsBgsFaceOffParser } from './event-parsers/battlegrounds/rtstats-bgs-face-offs-parser';
import { RTStatsBgsFreezeParser } from './event-parsers/battlegrounds/rtstats-bgs-freeze-parser';
import { RTStatsBgsHeroSelectedParser } from './event-parsers/battlegrounds/rtstats-bgs-hero-selected-parser';
import { RTStatsBgsLeaderboardPositionUpdatedParser } from './event-parsers/battlegrounds/rtstats-bgs-leaderboard-position-updated-parser';
import { RTStatBgsMinionsBoughtParser } from './event-parsers/battlegrounds/rtstats-bgs-minions-bought-parser';
import { RTStatBgsMinionsPlayedParser } from './event-parsers/battlegrounds/rtstats-bgs-minions-played-parser';
import { RTStatBgsMinionsSoldParser } from './event-parsers/battlegrounds/rtstats-bgs-minions-sold-parser';
import { RTStatsBgsOpponentRevealedParser } from './event-parsers/battlegrounds/rtstats-bgs-opponent-revealed-parser';
import { RTStatsBgsRerollsParser } from './event-parsers/battlegrounds/rtstats-bgs-rerolls-parser';
import { RTStatsBgsTriplesCreatedParser } from './event-parsers/battlegrounds/rtstats-bgs-triples-created-parser';
import { RTStatBgsTurnStartParser } from './event-parsers/battlegrounds/rtstats-bgs-turn-start-parser';
import { RTStatsGameStartParser } from './event-parsers/rtstats-game-start-parser';
import { RTStatHeroPowerUsedParser } from './event-parsers/rtstats-hero-power-used-parser';
import { RTStatsMetadataParser } from './event-parsers/rtstats-metadata-parser';
import { RTStatsMinionsKilledParser } from './event-parsers/rtstats-minions-killed-parser';
import { RTStatsReconnectOverParser } from './event-parsers/rtstats-reconnect-over-parser';
import { RTStatsReconnectStartParser } from './event-parsers/rtstats-reconnect-start-parser';
import { RTStatsResourcesWastedPerTurnParser } from './event-parsers/rtstats-resources-wasted-per-turn-parser';
import { RTStatsTotalDamageDealtByHeroesParser } from './event-parsers/rtstats-total-damage-dealt-by-heroes-parser';
import { RTStatsTotalDamageDealtByMinionsParser } from './event-parsers/rtstats-total-damage-dealt-by-minions-parser';
import { RTStatsTotalDamageTakenByHeroesParser } from './event-parsers/rtstats-total-damage-taken-by-heroes-parser';
import { RTStatsTotalDamageTakenByMinionsParser } from './event-parsers/rtstats-total-damage-taken-by-minions-parser';
import { RTStatTurnStartParser } from './event-parsers/rtstats-turn-start-parser';

@Injectable({ providedIn: 'root' })
export class RealTimeStatsParsersService {
	constructor(private readonly allCards: CardsFacadeService) {}

	public buildEventParsers(): { [eventKey: string]: readonly EventParser[] } {
		return {
			[Events.BATTLE_SIMULATION_HISTORY_UPDATED]: [new RTStatsBgsBattleHistoryUpdatedParser()],
			[GameEvent.ATTACKING_MINION]: [new RTStatBgsAttackFirstParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_BATTLE_RESULT]: [new RTStatsBgsFaceOffParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_COMBAT_START]: [new RTStatBgsTurnStartParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_ENEMY_HERO_KILLED]: [new RTStatBgsEnemyHeroKilledParser()],
			[GameEvent.BATTLEGROUNDS_FREEZE]: [new RTStatsBgsFreezeParser()],
			[GameEvent.BATTLEGROUNDS_HERO_SELECTED]: [new RTStatsBgsHeroSelectedParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_LEADERBOARD_PLACE]: [
				new RTStatsBgsLeaderboardPositionUpdatedParser(this.allCards),
			],
			[GameEvent.BATTLEGROUNDS_MINION_BOUGHT]: [new RTStatBgsMinionsBoughtParser()],
			[GameEvent.BATTLEGROUNDS_MINION_SOLD]: [new RTStatBgsMinionsSoldParser()],
			[GameEvent.BATTLEGROUNDS_OPPONENT_REVEALED]: [new RTStatsBgsOpponentRevealedParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_PLAYER_BOARD]: [new RTStatsBgsBoardStatsParser()],
			[GameEvent.BATTLEGROUNDS_RECRUIT_PHASE]: [new RTStatBgsTurnStartParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_REROLL]: [new RTStatsBgsRerollsParser()],
			[GameEvent.BATTLEGROUNDS_TRIPLE]: [new RTStatsBgsTriplesCreatedParser(this.allCards)],
			[GameEvent.CARD_PLAYED]: [new RTStatBgsMinionsPlayedParser(this.allCards)],
			[GameEvent.DAMAGE]: [
				new RTStatsTotalDamageDealtByMinionsParser(this.allCards),
				new RTStatsTotalDamageTakenByMinionsParser(this.allCards),
				new RTStatsTotalDamageDealtByHeroesParser(this.allCards),
				new RTStatsTotalDamageTakenByHeroesParser(this.allCards),
			],
			[GameEvent.GAME_START]: [new RTStatsGameStartParser()],
			[GameEvent.HERO_POWER_USED]: [new RTStatHeroPowerUsedParser()],
			[GameEvent.MATCH_METADATA]: [new RTStatsMetadataParser()],
			[GameEvent.MINIONS_DIED]: [new RTStatsMinionsKilledParser()],
			[GameEvent.RECONNECT_OVER]: [new RTStatsReconnectOverParser()],
			[GameEvent.RECONNECT_START]: [new RTStatsReconnectStartParser()],
			[GameEvent.RESOURCES_UPDATED]: [new RTStatsResourcesWastedPerTurnParser(this.allCards)],
			[GameEvent.TURN_START]: [new RTStatTurnStartParser()],
		};
	}
}

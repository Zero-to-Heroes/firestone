import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { RealTimeStatsState } from '@firestone/battlegrounds/core';
import { SceneService } from '@firestone/memory';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { RTStatsBgsLeaderboardPositionUpdatedParser } from '@services/battlegrounds/store/real-time-stats/event-parsers/battlegrounds/rtstats-bgs-leaderboard-position-updated-parser';
import { filter, take } from 'rxjs';
import { GameEvent } from '../../../../models/game-event';
import { Events } from '../../../events.service';
import { GameEventsEmitterService } from '../../../game-events-emitter.service';
import { ProcessingQueue } from '../../../processing-queue.service';
import { EventParser } from './event-parsers/_event-parser';
import { RTStatBgsAttackFirstParser } from './event-parsers/battlegrounds/rtstats-bgs-attack-first-parser';
import { RTStatsBgsBattleHistoryUpdatedParser } from './event-parsers/battlegrounds/rtstats-bgs-battle-history-updated-parser';
import { RTStatsBgsBoardStatsParser } from './event-parsers/battlegrounds/rtstats-bgs-board-stats-parser';
import { RTStatBgsEnemyHeroKilledParser } from './event-parsers/battlegrounds/rtstats-bgs-enemy-hero-killed-parser';
import { RTStatsBgsFaceOffParser } from './event-parsers/battlegrounds/rtstats-bgs-face-offs-parser';
import { RTStatsBgsFreezeParser } from './event-parsers/battlegrounds/rtstats-bgs-freeze-parser';
import { RTStatsBgsHeroSelectedParser } from './event-parsers/battlegrounds/rtstats-bgs-hero-selected-parser';
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

// TODO: move this into a mode-independant package, as it could be used for non-bg stuff
@Injectable()
export class RealTimeStatsService {
	private state: RealTimeStatsState = new RealTimeStatsState();
	private processingQueue = new ProcessingQueue<GameEvent>(
		(eventQueue) => this.processQueue(eventQueue),
		50,
		'bgs-real-time-stats-queue',
	);
	private eventParsers: readonly EventParser[];
	private listeners: ((state: RealTimeStatsState) => void)[] = [];

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly events: Events,
		private readonly allCards: CardsFacadeService,
		private readonly scene: SceneService,
	) {
		// Not sure how we can improve this
		// If I wait until I know we're in a BG game, then I miss the first few events
		this.initListeners();
	}

	public addListener(listener: (state: RealTimeStatsState) => void): void {
		if (!this.listeners.includes(listener)) {
			this.listeners.push(listener);
		}
		// if (!this.eventParsers?.length) {
		// }
	}

	private async initListeners() {
		await this.scene.isReady();

		this.scene.currentScene$$
			.pipe(
				filter((scene) => scene === SceneMode.BACON),
				take(1),
			)
			.subscribe(() => this.init());
	}

	private init() {
		console.log('[real-time-stats] init');
		this.eventParsers = this.buildEventParsers();
		this.gameEvents.allEvents.subscribe(async (gameEvent: GameEvent) => {
			this.processingQueue.enqueue(gameEvent);
		});
		this.events.on(Events.BATTLE_SIMULATION_HISTORY_UPDATED).subscribe((data) => {
			this.processingQueue.enqueue(
				Object.assign(new GameEvent(), {
					type: Events.BATTLE_SIMULATION_HISTORY_UPDATED,
					additionalData: {
						game: data.data[0],
					},
				}),
			);
		});
	}

	private async processQueue(eventQueue: readonly GameEvent[]) {
		try {
			const stateUpdateEvents = eventQueue.filter((event) => event.type === GameEvent.GAME_STATE_UPDATE);
			const eventsToProcess = [
				...eventQueue.filter((event) => event.type !== GameEvent.GAME_STATE_UPDATE),
				stateUpdateEvents.length > 0 ? stateUpdateEvents[stateUpdateEvents.length - 1] : null,
			].filter((event) => event);
			for (let i = 0; i < eventsToProcess.length; i++) {
				await this.processEvent(eventsToProcess[i]);
			}
		} catch (e) {
			console.error('Exception while processing event', e);
		}
		return [];
	}

	private async processEvent(gameEvent: GameEvent) {
		let newState = this.state;
		for (const parser of this.eventParsers) {
			try {
				if (parser.applies(gameEvent, newState ?? this.state)) {
					newState = await parser.parse(gameEvent, newState ?? this.state);
				}
			} catch (e) {
				console.error('[game-state] Exception while applying parser', parser.name(), e.message, e.stack, e);
			}
		}
		if (newState !== this.state) {
			this.state = newState;
			// console.debug('[real-time-stats] new state', gameEvent.type, this.state);
			this.listeners.forEach((listener) => listener(this.state));
		}
	}

	private buildEventParsers(): readonly EventParser[] {
		return [
			new RTStatsGameStartParser(),
			new RTStatsMetadataParser(),
			new RTStatsReconnectStartParser(),
			new RTStatsReconnectOverParser(),
			new RTStatTurnStartParser(),
			new RTStatsTotalDamageDealtByMinionsParser(this.allCards),
			new RTStatsTotalDamageTakenByMinionsParser(this.allCards),
			new RTStatsTotalDamageDealtByHeroesParser(this.allCards),
			new RTStatsTotalDamageTakenByHeroesParser(this.allCards),
			new RTStatsResourcesWastedPerTurnParser(this.allCards),
			new RTStatHeroPowerUsedParser(),
			new RTStatsMinionsKilledParser(),

			// BG-specific
			new RTStatBgsTurnStartParser(this.allCards),
			new RTStatsBgsHeroSelectedParser(this.allCards),
			new RTStatsBgsOpponentRevealedParser(this.allCards),
			new RTStatsBgsFaceOffParser(this.allCards),
			new RTStatsBgsBattleHistoryUpdatedParser(),
			new RTStatsBgsTriplesCreatedParser(this.allCards),
			new RTStatsBgsBoardStatsParser(),
			new RTStatsBgsRerollsParser(),
			new RTStatsBgsFreezeParser(),
			new RTStatBgsMinionsBoughtParser(),
			new RTStatBgsMinionsSoldParser(),
			new RTStatBgsMinionsPlayedParser(this.allCards),
			new RTStatBgsEnemyHeroKilledParser(),
			new RTStatBgsAttackFirstParser(this.allCards),
			new RTStatsBgsLeaderboardPositionUpdatedParser(this.allCards),
		];
	}
}

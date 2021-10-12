import { Injectable } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { GameEvent } from '../../../../models/game-event';
import { Events } from '../../../events.service';
import { GameEventsEmitterService } from '../../../game-events-emitter.service';
import { ProcessingQueue } from '../../../processing-queue.service';
import { RTStatBgsAttackFirstParser } from './event-parsers/battlegrounds/rtstats-bgs-attack-first-parser';
import { RTStatsBgsBattleHistoryUpdatedParser } from './event-parsers/battlegrounds/rtstats-bgs-battle-history-updated-parser';
import { RTStatsBgsBoardStatsParser } from './event-parsers/battlegrounds/rtstats-bgs-board-stats-parser';
import { RTStatBgsEnemyHeroKilledParser } from './event-parsers/battlegrounds/rtstats-bgs-enemy-hero-killed-parser';
import { RTStatsBgsFaceOffParser } from './event-parsers/battlegrounds/rtstats-bgs-face-offs-parser';
import { RTStatsBgsFreezeParser } from './event-parsers/battlegrounds/rtstats-bgs-freeze-parser';
import { RTStatsBgsHeroSelectedParser } from './event-parsers/battlegrounds/rtstats-bgs-hero-selected-parser';
import { RTStatBgsMinionsBoughtParser } from './event-parsers/battlegrounds/rtstats-bgs-minions-bought-parser';
import { RTStatBgsMinionsSoldParser } from './event-parsers/battlegrounds/rtstats-bgs-minions-sold-parser';
import { RTStatsBgsOpponentRevealedParser } from './event-parsers/battlegrounds/rtstats-bgs-opponent-revealed-parser';
import { RTStatsBgsRerollsParser } from './event-parsers/battlegrounds/rtstats-bgs-rerolls-parser';
import { RTStatsBgsTriplesCreatedParser } from './event-parsers/battlegrounds/rtstats-bgs-triples-created-parser';
import { RTStatBgsTurnStartParser } from './event-parsers/battlegrounds/rtstats-bgs-turn-start-parser';
import { RTStatsGameStartParser } from './event-parsers/rtstats-game-start-parser';
import { RTStatHeroPowerUsedParser } from './event-parsers/rtstats-hero-power-used-parser';
import { RTStatHpOverTurnParser } from './event-parsers/rtstats-hp-over-turn-parser';
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
import { EventParser } from './event-parsers/_event-parser';
import { RealTimeStatsState } from './real-time-stats';

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
	) {
		this.init();
	}

	public addListener(listener: (state: RealTimeStatsState) => void): void {
		this.listeners.push(listener);
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
		// this.debug('parsing', this.state);
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
			// this.debug('state', this.state);
			this.listeners.forEach((listener) => listener(this.state));
		}
	}

	private init() {
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
			new RTStatHpOverTurnParser(this.allCards),

			// BG-specific
			new RTStatBgsTurnStartParser(),
			new RTStatsBgsHeroSelectedParser(),
			new RTStatsBgsOpponentRevealedParser(),
			new RTStatsBgsFaceOffParser(),
			new RTStatsBgsBattleHistoryUpdatedParser(),
			new RTStatsBgsTriplesCreatedParser(),
			new RTStatsBgsBoardStatsParser(),
			new RTStatsBgsRerollsParser(),
			new RTStatsBgsFreezeParser(),
			new RTStatBgsMinionsBoughtParser(),
			new RTStatBgsMinionsSoldParser(),
			new RTStatBgsEnemyHeroKilledParser(),
			new RTStatBgsAttackFirstParser(this.allCards),
		];
	}

	private debug(...args) {
		console.debug('[bgs-real-time-stats]', ...args);
	}
}

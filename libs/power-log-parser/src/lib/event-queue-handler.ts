import { GameEvent, GameEventProvider, GameEventDebug } from './game-event';
import type { StateFacade } from './state/state-facade';

export class EventQueueHandler {
	eventQueue: GameEventProvider[] = [];
	private Helper: StateFacade;
	private onGameEvent: ((event: GameEvent) => void) | null = null;

	constructor(helper: StateFacade, onGameEvent: ((event: GameEvent) => void) | null) {
		this.Helper = helper;
		this.onGameEvent = onGameEvent;
	}

	Reset(helper: StateFacade): void {
		this.Helper = helper;
	}

	SetEventHandler(handler: ((event: GameEvent) => void) | null): void {
		this.onGameEvent = handler;
	}

	EnqueueGameEvent(providers: GameEventProvider[]): void {
		if (providers == null || providers.length === 0) {
			return;
		}

		providers = providers.filter((p) => p != null);

		if (
			providers.some((p) => p.CreationLogLine?.includes('CREATE_GAME') ?? false) &&
			this.eventQueue.length > 0
		) {
			this.ClearQueue();
		}

		if (this.eventQueue.length > 0) {
			const shouldUnqueuePredicates = providers
				.filter((p) => p.IsDuplicatePredicate != null)
				.map((p) => p.IsDuplicatePredicate!);

			if (shouldUnqueuePredicates.length > 0) {
				this.eventQueue = this.eventQueue.filter(
					(queued) => queued != null && !shouldUnqueuePredicates.some((predicate) => predicate(queued)),
				);
			}
		}

		this.eventQueue.push(...providers);
	}

	ClearQueue(): void {
		this.eventQueue.sort((a, b) => {
			const timestampComparison = a.Timestamp.localeCompare(b.Timestamp);
			return timestampComparison !== 0 ? timestampComparison : a.Index - b.Index;
		});
		for (const provider of this.eventQueue) {
			this.ProcessGameEvent(provider);
		}
		this.eventQueue.length = 0;
	}

	private ProcessGameEvent(provider: GameEventProvider): void {
		if (provider.SupplyGameEvent == null && provider.GameEvent == null) {
			return;
		}
		const gameEvent = provider.GameEvent != null ? provider.GameEvent : provider.SupplyGameEvent!();
		if (gameEvent != null) {
			gameEvent.Debug = {
				CreationLogLine: provider.CreationLogLine,
				Timestamp: provider.Timestamp,
				Index: provider.Index,
			};
			if (this.onGameEvent) {
				this.onGameEvent(gameEvent);
			}
		}
	}
}

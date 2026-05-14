import { GameEvent } from './game-event';

export class GameEventHandler {
	onEvent: ((event: GameEvent) => void) | null = null;
	onEventsAll: ((events: GameEvent[]) => void) | null = null;

	private queuedEvents: GameEvent[] = [];

	Handle(gameEvent: GameEvent): void {
		if (this.queuedEvents.length > 0) {
			if (gameEvent != null) {
				this.queuedEvents.push(gameEvent);
			}
			console.debug('Sending queued events', '');
			if (this.onEventsAll) {
				this.onEventsAll(this.queuedEvents);
			}
			this.queuedEvents = [];
		} else {
			if (this.onEvent) {
				this.onEvent(gameEvent);
			}
		}
	}
}

import { Card } from '../../../../../models/card';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class NewCardEvent implements MainWindowStoreEvent {
	constructor(card: Card, type: string) {
		this.card = card;
		this.type = type;
	}
	readonly card: Card;
	readonly type: string;

	public static eventName(): string {
		return 'NewCardEvent';
	}

	public eventName(): string {
		return 'NewCardEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}

import { MainWindowStoreEvent } from "../main-window-store-event";
import { Card } from "../../../../../models/card";

export class NewCardEvent implements MainWindowStoreEvent {
	readonly card: Card;
	readonly type: string;

	constructor(card: Card, type: string) {
		this.card = card;
		this.type = type;
	}
}
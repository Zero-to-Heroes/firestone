import { GameFormatString } from '@firestone-hs/reference-data';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedDeckbuilderFormatSelectedEvent implements MainWindowStoreEvent {
	
	readonly eventName = ConstructedDeckbuilderFormatSelectedEvent.eventName

	static readonly eventName = 'ConstructedDeckbuilderFormatSelectedEvent'

	constructor(public readonly format: GameFormatString) {}
}

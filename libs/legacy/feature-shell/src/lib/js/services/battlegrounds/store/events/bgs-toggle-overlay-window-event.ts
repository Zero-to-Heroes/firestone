import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsToggleOverlayWindowEvent extends BattlegroundsStoreEvent {
	public static readonly NAME: string = 'BgsToggleOverlayWindowEvent';

	constructor() {
		super(BgsToggleOverlayWindowEvent.NAME);
	}
}

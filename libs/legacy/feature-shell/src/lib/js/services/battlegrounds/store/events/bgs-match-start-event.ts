import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsMatchStartEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsMatchStartEvent' as const;

	constructor(
		public readonly mainWindowState: MainWindowState,
		public readonly spectating: boolean,
		public readonly simpleInit: boolean,
	) {
		super('BgsMatchStartEvent');
	}
}

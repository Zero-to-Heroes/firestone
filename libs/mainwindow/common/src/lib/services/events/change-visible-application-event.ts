import { MainWindowStoreEvent } from './main-window-store-event';
import { CurrentAppType } from '@firestone/shared/common/service';

export class ChangeVisibleApplicationEvent implements MainWindowStoreEvent {
	static readonly eventName = 'ChangeVisibleApplicationEvent';

	readonly eventName = ChangeVisibleApplicationEvent.eventName;

	constructor(
		public readonly module: CurrentAppType,
		public readonly forceApplicationVisible = false,
	) {}
}

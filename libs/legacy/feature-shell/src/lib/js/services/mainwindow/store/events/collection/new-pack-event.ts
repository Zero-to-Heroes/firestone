import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { InternalCardInfo } from '../../../../../models/collection/internal-card-info';

export class NewPackEvent implements MainWindowStoreEvent {
	constructor(
		public readonly setId: string,
		public readonly boosterId: number,
		public readonly packCards: readonly InternalCardInfo[],
	) {}

	public static eventName(): string {
		return 'NewPackEvent';
	}

	public eventName(): string {
		return 'NewPackEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}

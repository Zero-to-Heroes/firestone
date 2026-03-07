import { Injectable } from '@angular/core';
import { InternalCardInfo } from '@firestone/collection/data-access';
import { ICardsMonitorEventHandler } from '@firestone/collection/services';
import { MainWindowStateFacadeService, NewPackEvent } from '@firestone/mainwindow/common';

@Injectable()
export class CardsMonitorEventHandlerService implements ICardsMonitorEventHandler {
	constructor(private readonly mainWindowStateFacade: MainWindowStateFacadeService) {}

	onNewPack(setId: string, boosterId: number, packCards: readonly InternalCardInfo[]): void {
		this.mainWindowStateFacade.send(new NewPackEvent(setId, boosterId, packCards));
	}
}

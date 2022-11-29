import { Injectable } from '@angular/core';
import { CardsInitService } from '../../js/services/cards-init.service';
import { DebugService } from '../../js/services/debug.service';
import { OwNotificationsService } from '../../js/services/notifications.service';
import { OwUtilsService } from '../../js/services/plugins/ow-utils.service';
import { SettingsCommunicationService } from '../../js/services/settings/settings-communication.service';

@Injectable()
export class BootstrapEssentialServicesService {
	// All the constructors are there to start bootstrapping / registering everything
	constructor(
		private readonly initCardsService: CardsInitService,
		private readonly debugService: DebugService,
		private readonly notifs: OwNotificationsService,
		private readonly settingsCommunicationService: SettingsCommunicationService,
		private readonly init_OWUtilsService: OwUtilsService,
	) {}

	public async bootstrapServices(): Promise<void> {
		// First initialize the cards DB, as some of the dependencies injected in
		// app-bootstrap won't be able to start without the cards DB in place
		// Init is started in the constructor, but we make sure that all cards are properly retrieved before moving forward
		await this.initCardsService.init();
	}
}

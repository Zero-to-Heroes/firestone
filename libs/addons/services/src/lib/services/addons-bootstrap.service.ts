import { Injectable } from '@angular/core';
import { AppInjector } from '@firestone/shared/framework/core';
import { AddonsGameBridgeService } from './addons-game-bridge.service';
import { AddonsHostService } from './addons-host.service';
import { AddonsInstallService } from './addons-install.service';

@Injectable()
export class AddonsBootstrapService {
	public async init(): Promise<void> {
		// Ensure install facade is constructed, then start host + game bridge.
		AppInjector.get(AddonsInstallService);
		const host = AppInjector.get(AddonsHostService);
		const bridge = AppInjector.get(AddonsGameBridgeService);
		await host.init();
		await bridge.init();
		console.log('[addons] bootstrap complete');
	}
}

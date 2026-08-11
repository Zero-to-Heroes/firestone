import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AddonsApiGateway } from './services/addons-api-gateway';
import { AddonsBootstrapService } from './services/addons-bootstrap.service';
import { AddonsGameBridgeService } from './services/addons-game-bridge.service';
import { AddonsHostService } from './services/addons-host.service';
import { AddonsInstallService } from './services/addons-install.service';

@NgModule({
	imports: [CommonModule],
	providers: [
		AddonsApiGateway,
		AddonsInstallService,
		AddonsHostService,
		AddonsGameBridgeService,
		AddonsBootstrapService,
	],
})
export class AddonsServicesModule {}

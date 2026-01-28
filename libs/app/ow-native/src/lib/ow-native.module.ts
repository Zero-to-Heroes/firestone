import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsServicesModule } from '@firestone/battlegrounds/services';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { OwHotkeyHandlerService } from './services/ow-hotkey-handler.service';
import { OwWindowHandlerService } from './services/ow-window-handler.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule, SharedCommonServiceModule, BattlegroundsServicesModule],
	providers: [
		OwWindowHandlerService,
		OwHotkeyHandlerService,
	],
})
export class OwNativeModule { }

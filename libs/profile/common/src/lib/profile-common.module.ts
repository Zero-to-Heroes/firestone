import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { ACCOUNT_SERVICE_TOKEN } from '@firestone/shared/framework/core';
import { AccountService } from './services/account.service';
import { ProfileServiceFacade } from './services/profile-service-facade.service';

@NgModule({
	imports: [CommonModule, MemoryModule, SharedCommonServiceModule],
	providers: [
		AccountService,
		ProfileServiceFacade,
	],
})
export class ProfileCommonModule {}

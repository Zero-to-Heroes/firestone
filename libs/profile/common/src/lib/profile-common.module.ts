import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { AccountService } from './services/account.service';

@NgModule({
	imports: [CommonModule, MemoryModule, SharedCommonServiceModule],
	providers: [AccountService],
})
export class ProfileCommonModule {}

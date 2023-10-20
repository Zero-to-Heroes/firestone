import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { DuelsConfigService } from './services/duels-config.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule],
	providers: [DuelsConfigService],
})
export class DuelsGeneralModule {}

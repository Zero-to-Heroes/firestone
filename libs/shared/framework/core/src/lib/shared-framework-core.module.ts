import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { CardsFacadeService } from './services/cards-facade.service';
import { OverwolfService } from './services/overwolf.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCommonModule],
	providers: [OverwolfService, CardsFacadeService],
})
export class SharedFrameworkCoreModule {}

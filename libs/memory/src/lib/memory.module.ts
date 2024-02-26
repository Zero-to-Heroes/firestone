import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { CardMousedOverService } from './services/card-moused-over.service';
import { MemoryInspectionService } from './services/memory-inspection.service';
import { MemoryUpdatesService } from './services/memory-updates.service';
import { MindVisionFacadeService } from './services/mind-vision/mind-vision-facade.service';
import { MindVisionStateMachineService } from './services/mind-vision/mind-vision-state-machine.service';
import { SceneService } from './services/scene.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule, SharedFrameworkCommonModule, SharedCommonServiceModule],
	providers: [
		MemoryInspectionService,
		MindVisionStateMachineService,
		MindVisionFacadeService,
		MemoryUpdatesService,
		SceneService,
		CardMousedOverService,
	],
})
export class MemoryModule {}

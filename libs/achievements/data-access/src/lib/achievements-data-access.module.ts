import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { AchievementsRefLoaderService } from './ref/achievements-ref-loader.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule],
	providers: [AchievementsRefLoaderService]
})
export class AchievementsDataAccessModule {}

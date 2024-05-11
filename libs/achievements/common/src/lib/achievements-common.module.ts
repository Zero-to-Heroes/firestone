import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { AchievementsNavigationService } from './services/achievements-navigation.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule],
	providers: [AchievementsNavigationService],
})
export class AchievementsCommonModule {}

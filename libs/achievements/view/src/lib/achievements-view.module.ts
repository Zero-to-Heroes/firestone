import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { AchievementCategoryViewComponent } from './components/achievement-category-view.component';

const components = [AchievementCategoryViewComponent];
@NgModule({
	imports: [CommonModule, InlineSVGModule.forRoot(), SharedCommonViewModule, SharedFrameworkCoreModule],
	declarations: components,
	exports: components,
})
export class AchievementsViewModule {}

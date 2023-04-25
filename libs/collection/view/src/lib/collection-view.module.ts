import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { SetViewComponent } from './cards/set-view.component';

const components = [SetViewComponent];

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule, SharedCommonViewModule],
	declarations: components,
	exports: components,
})
export class CollectionViewModule {}

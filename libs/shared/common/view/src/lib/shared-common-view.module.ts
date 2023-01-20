import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { ToggleViewComponent } from './components/toggle/toggle-view.component';

@NgModule({
	imports: [CommonModule, SharedFrameworkCommonModule],
	declarations: [ToggleViewComponent],
	exports: [ToggleViewComponent],
})
export class SharedCommonViewModule {}

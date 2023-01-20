import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { NumericInputWithArrowsComponent } from './components/input/numeric-input-with-arrows.component';
import { ToggleViewComponent } from './components/toggle/toggle-view.component';

@NgModule({
	imports: [CommonModule, FormsModule, InlineSVGModule.forRoot(), SharedFrameworkCommonModule],
	declarations: [ToggleViewComponent, NumericInputWithArrowsComponent],
	exports: [ToggleViewComponent, NumericInputWithArrowsComponent],
})
export class SharedCommonViewModule {}

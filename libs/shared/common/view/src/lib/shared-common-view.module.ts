import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { SelectModule } from 'ng-select';
import { BasicBarChart2Component } from './components/charts/basic-bar-chart-2.component';
import { FilterDropdownMultiselectComponent } from './components/dropdown/filter-dropdown-multiselect.component';
import { FilterDropdownComponent } from './components/dropdown/filter-dropdown.component';
import { CheckboxComponent } from './components/input/checkbox.component';
import { NumericInputWithArrowsComponent } from './components/input/numeric-input-with-arrows.component';
import { ToggleViewComponent } from './components/toggle/toggle-view.component';
import { BuffInfoComponent } from './components/tooltip/buff-info.component';
import { CardTooltipComponent } from './components/tooltip/card-tooltip.component';
import { CardTooltipDirective } from './components/tooltip/card-tooltip.directive';
import { HelpTooltipComponent } from './components/tooltip/help-tooltip.component';
import { HelpTooltipDirective } from './components/tooltip/help-tooltip.directive';

const components = [
	BuffInfoComponent,
	CardTooltipComponent,
	CardTooltipDirective,
	HelpTooltipDirective,
	HelpTooltipComponent,

	FilterDropdownComponent,
	FilterDropdownMultiselectComponent,

	NumericInputWithArrowsComponent,
	CheckboxComponent,

	BasicBarChart2Component,

	ToggleViewComponent,
];

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		InlineSVGModule.forRoot(),
		SelectModule,
		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
	],
	declarations: components,
	exports: components,
})
export class SharedCommonViewModule {}

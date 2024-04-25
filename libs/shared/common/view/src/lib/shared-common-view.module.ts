import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { SelectModule } from 'ng-select';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { CardTileComponent } from './components/card/card-tile.component';
import { BasicBarChart2Component } from './components/charts/basic-bar-chart-2.component';
import { CopyDesckstringComponent } from './components/deck/copy-deckstring.component';
import { DeckListBasicComponent } from './components/deck/deck-list-basic.component';
import { FilterDropdownMultiselectComponent } from './components/dropdown/filter-dropdown-multiselect.component';
import { FilterDropdownComponent } from './components/dropdown/filter-dropdown.component';
import { CheckboxComponent } from './components/input/checkbox.component';
import { NumericInputWithArrowsComponent } from './components/input/numeric-input-with-arrows.component';
import { TextInputComponent } from './components/input/text-input.component';
import { ProgressBarComponent } from './components/misc/progress-bar.component';
import { ScrollableDirective } from './components/misc/scrollable.directive';
import { SortableLabelComponent } from './components/table/sortable-table-label.component';
import { ToggleViewComponent } from './components/toggle/toggle-view.component';
import { BuffInfoComponent } from './components/tooltip/buff-info.component';
import { CachedComponentTooltipDirective } from './components/tooltip/cached-component-tooltip.directive';
import { CardTooltipComponent } from './components/tooltip/card-tooltip.component';
import { CardTooltipDirective } from './components/tooltip/card-tooltip.directive';
import { HelpTooltipComponent } from './components/tooltip/help-tooltip.component';
import { HelpTooltipDirective } from './components/tooltip/help-tooltip.directive';
import { ShortDatePipe } from './pipes/short-date.pipe';

const components = [
	BuffInfoComponent,
	CardTooltipComponent,
	CardTooltipDirective,
	HelpTooltipDirective,
	HelpTooltipComponent,
	CachedComponentTooltipDirective,
	CardTileComponent,
	CopyDesckstringComponent,
	DeckListBasicComponent,

	FilterDropdownComponent,
	FilterDropdownMultiselectComponent,

	NumericInputWithArrowsComponent,
	TextInputComponent,
	CheckboxComponent,

	BasicBarChart2Component,

	SortableLabelComponent,

	ProgressBarComponent,

	ToggleViewComponent,

	ScrollableDirective,

	ShortDatePipe,
];

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		A11yModule,

		InlineSVGModule.forRoot(),
		SelectModule,
		VirtualScrollerModule,
		NgScrollbarModule,

		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
	],
	declarations: components,
	exports: components,
	providers: [ShortDatePipe, DatePipe],
})
export class SharedCommonViewModule {}

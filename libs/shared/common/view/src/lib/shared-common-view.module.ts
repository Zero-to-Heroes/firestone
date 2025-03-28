import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { SelectModule } from 'ng-select';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { CardTileComponent } from './components/card/card-tile.component';
import { BasicBarChart2Component } from './components/charts/basic-bar-chart-2.component';
import { StatCellComponent } from './components/charts/stat-cell.component';
import { CopyDesckstringComponent } from './components/deck/copy-deckstring.component';
import { DeckListBasicComponent } from './components/deck/deck-list-basic.component';
import { FilterDropdownCombinedComponent } from './components/dropdown/filter-dropdown-combined.component';
import { FilterDropdownMultiselectComponent } from './components/dropdown/filter-dropdown-multiselect.component';
import { FilterDropdownComponent } from './components/dropdown/filter-dropdown.component';
import { PreferenceDropdownComponent } from './components/dropdown/preference-dropdown.component';
import { PreferenceYNLimitedComponent } from './components/dropdown/preference-ynlimited-dropdown.component';
import { CheckboxComponent } from './components/input/checkbox.component';
import { NumericInputWithArrowsComponent } from './components/input/numeric-input-with-arrows.component';
import { NumericInputComponent } from './components/input/numeric-input.component';
import { PreferenceNumericInputComponent } from './components/input/preference-numeric-input.component';
import { TextInputComponent } from './components/input/text-input.component';
import { ProgressBarComponent } from './components/misc/progress-bar.component';
import { ScrollableDirective } from './components/misc/scrollable.directive';
import { PreferenceSliderComponent } from './components/slider/preference-slider.component';
import { SortableLabelComponent } from './components/table/sortable-table-label.component';
import { PreferenceToggleComponent } from './components/toggle/preference-toggle.component';
import { ToggleViewComponent } from './components/toggle/toggle-view.component';
import { BuffInfoComponent } from './components/tooltip/buff-info.component';
import { CachedComponentTooltipDirective } from './components/tooltip/cached-component-tooltip.directive';
import { CardTooltipComponent } from './components/tooltip/card-tooltip.component';
import { CardTooltipDirective } from './components/tooltip/card-tooltip.directive';
import { ComponentTooltipDirective } from './components/tooltip/component-tooltip.directive';
import { HelpTooltipComponent } from './components/tooltip/help-tooltip.component';
import { HelpTooltipDirective } from './components/tooltip/help-tooltip.directive';
import { PremiumSettingDirective } from './directives/premium-setting.directive';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { ShortDatePipe } from './pipes/short-date.pipe';

const components = [
	BuffInfoComponent,
	CardTooltipComponent,
	CardTooltipDirective,
	HelpTooltipDirective,
	HelpTooltipComponent,
	ComponentTooltipDirective,
	CachedComponentTooltipDirective,
	CardTileComponent,
	CopyDesckstringComponent,
	DeckListBasicComponent,

	FilterDropdownComponent,
	FilterDropdownMultiselectComponent,
	FilterDropdownCombinedComponent,
	PreferenceDropdownComponent,
	PreferenceYNLimitedComponent,

	NumericInputComponent,
	NumericInputWithArrowsComponent,
	PreferenceNumericInputComponent,
	TextInputComponent,
	CheckboxComponent,

	BasicBarChart2Component,
	StatCellComponent,

	SortableLabelComponent,

	ProgressBarComponent,

	ToggleViewComponent,
	PreferenceToggleComponent,
	PreferenceSliderComponent,

	ScrollableDirective,
	PremiumSettingDirective,

	ShortDatePipe,
	SafeHtmlPipe,
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
		SharedCommonServiceModule,
	],
	declarations: components,
	exports: components,
	providers: [ShortDatePipe, DatePipe],
})
export class SharedCommonViewModule {}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { WebBattlegroundsFiltersComponent } from '../filters/_web-battlegrounds-filters.component';
import { WebBattlegroundsRankFilterDropdownComponent } from '../filters/web-battlegrounds-rank-filter-dropdown.component';
import { WebBattlegroundsTimeFilterDropdownComponent } from '../filters/web-battlegrounds-time-filter-dropdown.component';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { CommonModule } from '@angular/common';
import { WebBattlegroundsModeFilterDropdownComponent } from '../filters/web-battlegrounds-mode-filter-dropdown.component';
import { WebBattlegroundsTribesFilterDropdownComponent } from '../filters/web-battlegrounds-tribes-filter-dropdown.component';

@Component({
	standalone: true,
	selector: 'battlegrounds-cards',
	templateUrl: './battlegrounds-cards.component.html',
	styleUrls: ['./battlegrounds-cards.component.scss'],
	imports: [
		CommonModule,

		BattlegroundsViewModule,

		WebBattlegroundsFiltersComponent,
		WebBattlegroundsRankFilterDropdownComponent,
		WebBattlegroundsTimeFilterDropdownComponent,
		WebBattlegroundsTribesFilterDropdownComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCardsComponent {}

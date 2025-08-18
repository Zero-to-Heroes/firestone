import { Component } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { WebBattlegroundsFiltersComponent } from '../filters/_web-battlegrounds-filters.component';
import { WebBattlegroundsRankFilterDropdownComponent } from '../filters/web-battlegrounds-rank-filter-dropdown.component';
import { WebBattlegroundsTimeFilterDropdownComponent } from '../filters/web-battlegrounds-time-filter-dropdown.component';

@Component({
	standalone: true,
	selector: 'battlegrounds-compositions',
	templateUrl: './battlegrounds-compositions.component.html',
	styleUrls: ['./battlegrounds-compositions.component.scss'],
	imports: [
		InlineSVGModule,
		SharedFrameworkCoreModule,

		WebBattlegroundsFiltersComponent,
		WebBattlegroundsRankFilterDropdownComponent,
		WebBattlegroundsTimeFilterDropdownComponent,
	],
})
export class BattlegroundsCompositionsComponent {}

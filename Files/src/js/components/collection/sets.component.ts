import { Component, NgZone, OnInit, Input } from '@angular/core';

import { Set } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'sets',
	styleUrls: [
		`../../../css/component/collection/sets.component.scss`,
		`../../../css/global/scrollbar.scss`
	],
	template: `
		<div class="sets">
			<sets-container [sets]="standardSets" [category]="'Standard'" *ngIf="showStandard"></sets-container>
			<sets-container [sets]="wildSets" [category]="'Wild'" *ngIf="showWild"></sets-container>
		</div>
	`,
})
// 7.1.1.17994
export class SetsComponent {

	@Input() standardSets: Set[];
	@Input() wildSets: Set[];

	showStandard = true;
	showWild = true;

	@Input('selectedFormat') set selectedFormat(format: string) {
		switch (format) {
			case 'standard':
				this.showStandard = true;
				this.showWild = false;
				break;
			case 'wild':
				this.showStandard = false;
				this.showWild = true;
				break;
			default:
				this.showStandard = true;
				this.showWild = true;
		}
	}
}

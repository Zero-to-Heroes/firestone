import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef } from '@angular/core';

import { Set } from '../../models/set';

@Component({
	selector: 'sets',
	styleUrls: [`../../../css/component/collection/sets.component.scss`],
	template: `
		<div class="sets">
			<ul class="menu-selection">
				<li [ngClass]="{ 'active': showStandard }" (mousedown)="toggleStandard()">Standard</li>
				<li [ngClass]="{ 'active': showWild }" (mousedown)="toggleWild()">Wild</li>
			</ul>
			<sets-container [sets]="standardSets" [category]="'Standard'" *ngIf="showStandard"></sets-container>
			<sets-container [sets]="wildSets" [category]="'Wild'" *ngIf="showWild"></sets-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetsComponent {
	@Input() standardSets: Set[];
	@Input() wildSets: Set[];

	showStandard = true;
	showWild = false;

	constructor(private cdr: ChangeDetectorRef) {}

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
				this.showWild = false;
		}
	}

	toggleStandard() {
		console.log('showing standard sets');
		this.showStandard = true;
		this.showWild = false;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleWild() {
		console.log('showing wild sets');
		this.showStandard = false;
		this.showWild = true;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}

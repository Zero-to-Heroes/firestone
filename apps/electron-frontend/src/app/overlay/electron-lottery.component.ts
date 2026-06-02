import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewRef } from '@angular/core';
import { ElectronEntryPointComponent } from './electron-entry-point.component';

@Component({
	standalone: false,
	selector: 'electron-lottery',
	styleUrls: [`./electron-lottery.component.scss`],
	template: `
		<electron-window-wrapper [activeTheme]="'general'" [allowResize]="false" *ngIf="ready">
			<lottery class="widget"></lottery>
		</electron-window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElectronLotteryComponent extends ElectronEntryPointComponent implements OnInit {
	ready = false;

	constructor(private readonly cdr: ChangeDetectorRef) {
		super();
	}

	async ngOnInit() {
		await super.ngOnInit();

		document.title = 'Firestone Lottery';
		this.ready = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

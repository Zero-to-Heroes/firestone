import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewRef } from '@angular/core';
import { ElectronEntryPointComponent } from './electron-entry-point.component';

@Component({
	standalone: false,
	selector: 'electron-collection',
	styleUrls: [`./electron-collection.component.scss`],
	template: `
		<electron-window-wrapper [activeTheme]="'general'" [allowResize]="true" *ngIf="ready">
		</electron-window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElectronCollectionComponent extends ElectronEntryPointComponent implements OnInit {
	ready = false;

	constructor(private readonly cdr: ChangeDetectorRef) {
		super();
	}

	async ngOnInit() {
		await super.ngOnInit();

		// Change the title of the window to "Settings"
		document.title = 'Main Window';
		this.ready = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

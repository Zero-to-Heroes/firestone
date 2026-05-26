import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewRef } from '@angular/core';
import { ElectronEntryPointComponent } from './electron-entry-point.component';

@Component({
	standalone: false,
	selector: 'electron-battlegrounds',
	styleUrls: [`./electron-battlegrounds.component.scss`],
	template: `
		<electron-window-wrapper
			*ngIf="ready"
			[activeTheme]="'battlegrounds'"
			[allowResize]="true"
			[avoidGameOverlap]="true"
		>
			<battlegrounds-root></battlegrounds-root>
		</electron-window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElectronBattlegroundsComponent extends ElectronEntryPointComponent implements OnInit {
	ready = false;

	constructor(private readonly cdr: ChangeDetectorRef) {
		super();
	}

	async ngOnInit() {
		await super.ngOnInit();

		document.title = 'Battlegrounds';
		this.ready = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

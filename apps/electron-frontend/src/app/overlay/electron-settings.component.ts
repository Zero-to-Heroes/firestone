import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewRef } from '@angular/core';
import { ElectronEntryPointComponent } from './electron-entry-point.component';

@Component({
	standalone: false,
	selector: 'electron-settings',
	styleUrls: [`./electron-settings.component.scss`],
	template: `
		<electron-window-wrapper [activeTheme]="'general'" [allowResize]="true" *ngIf="ready">
			<!-- Here BE SETTINGS! -->
			<!-- <div class="controls">
				<control-close [windowId]="thisWindowId" [shouldHide]="false"></control-close>
			</div>-->
			<settings-root></settings-root>
		</electron-window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElectronSettingsComponent extends ElectronEntryPointComponent implements OnInit {
	ready = false;

	constructor(private readonly cdr: ChangeDetectorRef) {
		super();
	}

	async ngOnInit() {
		await super.ngOnInit();

		// Change the title of the window to "Settings"
		document.title = 'Settings';
		this.ready = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

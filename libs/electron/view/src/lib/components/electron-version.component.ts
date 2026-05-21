import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';

@Component({
	standalone: false,
	selector: 'electron-version',
	styleUrls: ['./electron-version.component.scss'],
	template: ` <div class="version-info">v.{{ version }}</div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElectronVersionComponent implements AfterViewInit {
	version = '';

	constructor(private readonly cdr: ChangeDetectorRef) {}

	async ngAfterViewInit() {
		const electronAPI = (window as { electronAPI?: { getAppVersion?: () => Promise<string> } }).electronAPI;
		this.version = (await electronAPI?.getAppVersion?.()) ?? '';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

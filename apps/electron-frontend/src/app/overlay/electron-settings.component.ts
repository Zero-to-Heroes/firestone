import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, OnDestroy } from '@angular/core';
import { ScalingService } from '@firestone/shared/common/service';
import { Subscription } from 'rxjs';

@Component({
	standalone: false,
	selector: 'electron-settings',
	styleUrls: [`./electron-settings.component.scss`],
	template: `
		Here BE SETTINGS!
		<!-- <electron-window-wrapper [activeTheme]="'general'" [allowResize]="true">
			<div class="controls">
				<control-close [windowId]="thisWindowId" [shouldHide]="false"></control-close>
			</div>
			<settings-root></settings-root>
		</electron-window-wrapper> -->
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElectronSettingsComponent implements AfterViewInit, OnDestroy {
	initReady = true;
	thisWindowId: string;

	private settingsSubscription: Subscription;

	constructor(private readonly init_ScalingService: ScalingService) {}

	async ngAfterViewInit() {
		// this.thisWindowId = (await this.ow.getCurrentWindow()).id;
		console.log('ngAfterViewInit complete');
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.settingsSubscription?.unsubscribe();
	}

	// @HostListener('mousedown', ['$event'])
	// dragMove(event: MouseEvent) {
	// 	const path: any[] = event.composedPath();
	// 	// Hack for drop-downs
	// 	if (
	// 		path.length > 2 &&
	// 		path[0].localName === 'div' &&
	// 		path[0].className?.includes('options') &&
	// 		path[1].localName === 'div' &&
	// 		path[1].className?.includes('below')
	// 	) {
	// 		return;
	// 	}

	// 	this.ow.dragMove(this.thisWindowId);
	// }
}

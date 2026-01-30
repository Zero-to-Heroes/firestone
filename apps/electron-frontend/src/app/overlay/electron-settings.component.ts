import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { ScalingService } from '@firestone/shared/common/service';

@Component({
	standalone: false,
	selector: 'electron-settings',
	styleUrls: [`./electron-settings.component.scss`],
	template: `
		<electron-window-wrapper [activeTheme]="'general'" [allowResize]="true">
			<!-- Here BE SETTINGS! -->
			<!-- <div class="controls">
				<control-close [windowId]="thisWindowId" [shouldHide]="false"></control-close>
			</div>-->
			<settings-root></settings-root>
		</electron-window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElectronSettingsComponent implements AfterViewInit {
	constructor(private readonly init_ScalingService: ScalingService) {}

	async ngAfterViewInit() {
		// this.thisWindowId = (await this.ow.getCurrentWindow()).id;
		console.log('ngAfterViewInit complete');

		// Change the title of the window to "Settings"
		document.title = 'Settings';
	}
}

import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, OnDestroy } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Subscription } from 'rxjs';
import { DebugService } from '../../services/debug.service';
import { FeatureFlags } from '../../services/feature-flags';

@Component({
	selector: 'settings',
	styleUrls: [`./settings.component.scss`],
	template: `
		<window-wrapper [activeTheme]="'general'" [allowResize]="true">
			<div class="controls">
				<control-close [windowId]="thisWindowId" [shouldHide]="false"></control-close>
			</div>
			<settings-root></settings-root>
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements AfterViewInit, OnDestroy {
	useNewSettings = FeatureFlags.USE_NEW_SETTINGS;

	initReady = true;
	thisWindowId: string;

	private settingsSubscription: Subscription;

	constructor(private debugService: DebugService, private ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.thisWindowId = (await this.ow.getCurrentWindow()).id;
		console.log('ngAfterViewInit complete');
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.settingsSubscription?.unsubscribe();
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		const path: any[] = event.composedPath();
		// Hack for drop-downs
		if (
			path.length > 2 &&
			path[0].localName === 'div' &&
			path[0].className?.includes('options') &&
			path[1].localName === 'div' &&
			path[1].className?.includes('below')
		) {
			return;
		}

		this.ow.dragMove(this.thisWindowId);
	}
}

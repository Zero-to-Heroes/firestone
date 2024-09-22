import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Subscription } from 'rxjs';
import { DebugService } from '../../services/debug.service';
import { FeatureFlags } from '../../services/feature-flags';
import { LocalizationFacadeService } from '../../services/localization-facade.service';

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
	selectedApp = 'general';
	selectedMenu: string;

	private settingsEventBus: EventEmitter<[string, string]>;
	private messageReceivedListener: (message: any) => void;
	private settingsSubscription: Subscription;

	constructor(
		private debugService: DebugService,
		private ow: OverwolfService,
		private cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		// this.init();
	}

	// private async init() {
	// 	await this.i18n.init();
	// 	this.initReady = true;
	// 	if (!(this.cdr as ViewRef)?.destroyed) {
	// 		this.cdr.detectChanges();
	// 	}
	// }

	async ngAfterViewInit() {
		this.thisWindowId = (await this.ow.getCurrentWindow()).id;
		window['selectApp'] = this.onAppSelected;
		this.settingsEventBus = this.ow.getMainWindow().settingsEventBus;
		this.settingsSubscription = this.settingsEventBus.subscribe(([selectedApp, selectedMenu]) => {
			this.selectApp(selectedApp ?? 'general', selectedMenu);
		});
		console.log('ngAfterViewInit complete');
		// this.messageReceivedListener = this.ow.addMessageReceivedListener(async (message) => {
		// 	if (message.id === 'move') {
		// 		const window = await this.ow.getCurrentWindow();
		// 		const newX = message.content.x - window.width / 2;
		// 		const newY = message.content.y - window.height / 2;
		// 		this.ow.changeWindowPosition(this.thisWindowId, newX, newY);
		// 	}
		// });
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeMessageReceivedListener(this.messageReceivedListener);
		this.settingsSubscription?.unsubscribe();
	}

	onAppSelected(selectedApp: string, selectedMenu?: string) {
		this.selectApp(selectedApp, selectedMenu);
	}

	selectApp(selectedApp: string, selectedMenu?: string) {
		this.selectedApp = selectedApp === 'duels' ? 'general' : selectedApp;
		this.selectedMenu = selectedMenu || this.getDefaultMenu(selectedApp);
		console.log('selecting app', this.selectedApp, this.selectedMenu);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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

	private getDefaultMenu(selectedApp: string): string {
		switch (selectedApp) {
			case 'general':
				return 'launch';
			case 'achievements':
				return 'notifications';
			case 'collection':
				return 'notification';
			case 'decktracker':
				return 'your-deck';
			case 'replays':
				return 'general';
			case 'battlegrounds':
				return 'general';
		}
		return null;
	}
}

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
import { Subscription } from 'rxjs';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'settings',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings.component.scss`,
	],
	template: `
		<window-wrapper [activeTheme]="'general'">
			<section class="title-bar">
				<div class="title" [owTranslate]="'settings.title'"></div>
				<div class="controls">
					<control-close [windowId]="thisWindowId" [shouldHide]="true"></control-close>
				</div>
			</section>
			<settings-app-selection [selectedApp]="selectedApp" (onAppSelected)="onAppSelected($event)">
			</settings-app-selection>
			<ng-container [ngSwitch]="selectedApp">
				<settings-general *ngSwitchCase="'general'" [selectedMenu]="selectedMenu"></settings-general>
				<settings-achievements
					*ngSwitchCase="'achievements'"
					[selectedMenu]="selectedMenu"
				></settings-achievements>
				<settings-collection *ngSwitchCase="'collection'" [selectedMenu]="selectedMenu"></settings-collection>
				<settings-decktracker
					*ngSwitchCase="'decktracker'"
					[selectedMenu]="selectedMenu"
				></settings-decktracker>
				<settings-replays *ngSwitchCase="'replays'" [selectedMenu]="selectedMenu"></settings-replays>
				<settings-battlegrounds
					*ngSwitchCase="'battlegrounds'"
					[selectedMenu]="selectedMenu"
				></settings-battlegrounds>
				<settings-mercenaries
					*ngSwitchCase="'mercenaries'"
					[selectedMenu]="selectedMenu"
				></settings-mercenaries>
			</ng-container>
			<settings-advanced-toggle></settings-advanced-toggle>
			<settings-modal></settings-modal>
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements AfterViewInit, OnDestroy {
	thisWindowId: string;
	selectedApp = 'general';
	selectedMenu: string;

	private settingsEventBus: EventEmitter<[string, string]>;
	private messageReceivedListener: (message: any) => void;
	private settingsSubscription: Subscription;

	constructor(private debugService: DebugService, private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	async ngAfterViewInit() {
		this.thisWindowId = (await this.ow.getCurrentWindow()).id;
		window['selectApp'] = this.onAppSelected;
		this.settingsEventBus = this.ow.getMainWindow().settingsEventBus;
		this.settingsSubscription = this.settingsEventBus.subscribe(([selectedApp, selectedMenu]) => {
			// No replays screen yet

			this.selectApp(selectedApp, selectedMenu);
		});
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

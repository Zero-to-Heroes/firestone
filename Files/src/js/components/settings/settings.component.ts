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
		<window-wrapper>
			<div class="app-container" [activeTheme]="'general'">
				<section class="title-bar">
					<div class="title">Settings</div>
					<div class="controls">
						<control-close [windowId]="thisWindowId"></control-close>
					</div>
				</section>
				<settings-app-selection [selectedApp]="selectedApp" (onAppSelected)="onAppSelected($event)">
				</settings-app-selection>
				<ng-container [ngSwitch]="selectedApp">
					<settings-general *ngSwitchCase="'general'" [selectedMenu]="selectedMenu"></settings-general>
					<settings-collection
						*ngSwitchCase="'collection'"
						[selectedMenu]="selectedMenu"
					></settings-collection>
					<settings-achievements
						*ngSwitchCase="'achievements'"
						[selectedMenu]="selectedMenu"
					></settings-achievements>
					<settings-decktracker
						*ngSwitchCase="'decktracker'"
						[selectedMenu]="selectedMenu"
					></settings-decktracker>
				</ng-container>
				<settings-modal></settings-modal>
			</div>
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
		this.settingsSubscription = this.settingsEventBus.subscribe(([selectedApp, selectedMenu]) =>
			this.selectApp(selectedApp, selectedMenu),
		);
		this.messageReceivedListener = this.ow.addMessageReceivedListener(async message => {
			if (message.id === 'move') {
				const window = await this.ow.getCurrentWindow();
				const newX = message.content.x - window.width / 2;
				const newY = message.content.y - window.height / 2;
				this.ow.changeWindowPosition(this.thisWindowId, newX, newY);
			}
		});
	}

	ngOnDestroy(): void {
		this.ow.removeMessageReceivedListener(this.messageReceivedListener);
		this.settingsSubscription.unsubscribe();
	}

	onAppSelected(selectedApp: string) {
		this.selectedApp = selectedApp;
	}

	selectApp(selectedApp: string, selectedMenu: string) {
		console.log('selectApp', selectedApp, selectedMenu);
		this.selectedApp = selectedApp;
		this.selectedMenu = selectedMenu;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		this.ow.dragMove(this.thisWindowId);
	}
}

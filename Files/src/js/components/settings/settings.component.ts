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
		`../../../css/themes/general-theme.scss`,
	],
	template: `
		<div class="root" [activeTheme]="'general'">
			<div class="app-container">
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

			<i class="i-54 gold-theme corner top-left">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
				</svg>
			</i>
			<i class="i-54 gold-theme corner top-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
				</svg>
			</i>
			<i class="i-54 gold-theme corner bottom-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
				</svg>
			</i>
			<i class="i-54 gold-theme corner bottom-left">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
				</svg>
			</i>
		</div>
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

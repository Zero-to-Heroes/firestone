import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'settings-decktracker',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker.component.scss`,
	],
	template: `
		<ul class="decktracker">
			<settings-decktracker-menu [selectedMenu]="_selectedMenu" (onMenuSelected)="onMenuSelected($event)">
			</settings-decktracker-menu>
			<ng-container [ngSwitch]="_selectedMenu">
				<settings-decktracker-launch *ngSwitchCase="'launch'"></settings-decktracker-launch>
				<settings-decktracker-appearance *ngSwitchCase="'appearance'"></settings-decktracker-appearance>
				<settings-decktracker-features *ngSwitchCase="'features'"></settings-decktracker-features>
				<settings-broadcast *ngSwitchCase="'broadcast'"></settings-broadcast>
				<settings-decktracker-beta *ngSwitchCase="'beta'"></settings-decktracker-beta>
			</ng-container>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerComponent {
	_selectedMenu: string;
	@Input() set selectedMenu(value: string) {
		this._selectedMenu = value || 'launch';
	}

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

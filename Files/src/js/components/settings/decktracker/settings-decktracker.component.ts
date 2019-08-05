import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'settings-decktracker',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker.component.scss`,
	],
	template: `
		<ul class="decktracker">
			<settings-decktracker-menu [selectedMenu]="selectedMenu" (onMenuSelected)="onMenuSelected($event)"> </settings-decktracker-menu>
			<ng-container [ngSwitch]="selectedMenu">
				<settings-decktracker-launch *ngSwitchCase="'launch'"></settings-decktracker-launch>
				<settings-decktracker-appearance *ngSwitchCase="'appearance'"></settings-decktracker-appearance>
				<settings-broadcast *ngSwitchCase="'broadcast'"></settings-broadcast>
			</ng-container>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerComponent {
	selectedMenu = 'launch';

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

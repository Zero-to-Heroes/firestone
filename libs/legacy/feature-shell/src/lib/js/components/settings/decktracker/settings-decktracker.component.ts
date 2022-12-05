import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'settings-decktracker',
	styleUrls: [`../../../../css/component/settings/decktracker/settings-decktracker.component.scss`],
	template: `
		<ul class="decktracker">
			<settings-decktracker-menu [selectedMenu]="_selectedMenu" (onMenuSelected)="onMenuSelected($event)">
			</settings-decktracker-menu>
			<ng-container [ngSwitch]="_selectedMenu">
				<settings-decktracker-your-deck *ngSwitchCase="'your-deck'"></settings-decktracker-your-deck>
				<settings-decktracker-opponent-deck
					*ngSwitchCase="'opponent-deck'"
				></settings-decktracker-opponent-deck>
				<settings-decktracker-global *ngSwitchCase="'global'"></settings-decktracker-global>
				<settings-decktracker-turn-timer *ngSwitchCase="'turn-timer'"></settings-decktracker-turn-timer>
				<settings-decktracker-launch *ngSwitchCase="'launch'"></settings-decktracker-launch>
				<settings-decktracker-duels *ngSwitchCase="'duels'"></settings-decktracker-duels>
			</ng-container>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerComponent {
	_selectedMenu: string;
	@Input() set selectedMenu(value: string) {
		this._selectedMenu = value || 'your-deck';
	}

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

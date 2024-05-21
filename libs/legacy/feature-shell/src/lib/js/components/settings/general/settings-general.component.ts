import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'settings-general',
	styleUrls: [`../../../../css/component/settings/general/settings-general.component.scss`],
	template: `
		<ul class="general">
			<settings-general-menu [selectedMenu]="_selectedMenu" (onMenuSelected)="onMenuSelected($event)">
			</settings-general-menu>
			<ng-container [ngSwitch]="_selectedMenu">
				<settings-general-launch *ngSwitchCase="'launch'" scrollable></settings-general-launch>
				<settings-general-premium *ngSwitchCase="'premium'"></settings-general-premium>
				<settings-general-lottery *ngSwitchCase="'lottery'"></settings-general-lottery>
				<settings-general-localization *ngSwitchCase="'localization'"></settings-general-localization>
				<settings-general-third-party *ngSwitchCase="'third-party'"></settings-general-third-party>
				<settings-general-bug-report *ngSwitchCase="'bugreport'"></settings-general-bug-report>
				<settings-decktracker-beta *ngSwitchCase="'beta'"></settings-decktracker-beta>
				<settings-broadcast *ngSwitchCase="'broadcast'"></settings-broadcast>
				<settings-discord *ngSwitchCase="'discord'"></settings-discord>
				<settings-general-data *ngSwitchCase="'data'"></settings-general-data>
				<settings-general-quests *ngSwitchCase="'quests'"></settings-general-quests>
				<settings-general-mods *ngSwitchCase="'mods'"></settings-general-mods>
				<settings-general-appearance *ngSwitchCase="'appearance'"></settings-general-appearance>
			</ng-container>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralComponent {
	_selectedMenu: string;

	@Input() set selectedMenu(value: string) {
		this._selectedMenu = value || 'launch';
	}

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

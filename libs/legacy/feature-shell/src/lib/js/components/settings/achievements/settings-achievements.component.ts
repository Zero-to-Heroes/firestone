import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'settings-achievements',
	styleUrls: [`../../../../css/component/settings/achievements/settings-achievements.component.scss`],
	template: `
		<ul class="achievements">
			<settings-achievements-menu [selectedMenu]="_selectedMenu" (onMenuSelected)="onMenuSelected($event)">
			</settings-achievements-menu>
			<ng-container [ngSwitch]="_selectedMenu">
				<settings-achievements-notifications
					*ngSwitchCase="'notifications'"
				></settings-achievements-notifications>
				<settings-achievements-live *ngSwitchCase="'live'"></settings-achievements-live>
			</ng-container>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsComponent {
	_selectedMenu: string;
	@Input() set selectedMenu(value: string) {
		this._selectedMenu = value || 'notifications';
	}

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
	selector: 'settings-achievements',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/achievements/settings-achievements.component.scss`,
	],
	template: `
		<ul class="achievements">
			<settings-achievements-menu [selectedMenu]="_selectedMenu" (onMenuSelected)="onMenuSelected($event)">
			</settings-achievements-menu>
			<ng-container [ngSwitch]="_selectedMenu">
				<settings-achievements-capture *ngSwitchCase="'capture'"></settings-achievements-capture>
			</ng-container>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsComponent {
	_selectedMenu: string;
	@Input() set selectedMenu(value: string) {
		this._selectedMenu = value || 'capture';
	}

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

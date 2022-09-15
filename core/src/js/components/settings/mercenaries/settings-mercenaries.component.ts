import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'settings-mercenaries',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/mercenaries/settings-mercenaries.component.scss`,
	],
	template: `
		<div class="mercenaries">
			<settings-mercenaries-menu [selectedMenu]="_selectedMenu" (onMenuSelected)="onMenuSelected($event)">
			</settings-mercenaries-menu>
			<ng-container [ngSwitch]="_selectedMenu">
				<settings-mercenaries-general *ngSwitchCase="'general'"></settings-mercenaries-general>
				<settings-mercenaries-quests *ngSwitchCase="'quests'"></settings-mercenaries-quests>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsMercenariesComponent {
	_selectedMenu: string;
	@Input() set selectedMenu(value: string) {
		this._selectedMenu = value || 'general';
	}

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

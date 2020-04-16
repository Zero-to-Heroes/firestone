import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'settings-battlegrounds',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/battlegrounds/settings-battlegrounds.component.scss`,
	],
	template: `
		<div class="battlegrounds">
			<settings-battlegrounds-menu [selectedMenu]="_selectedMenu" (onMenuSelected)="onMenuSelected($event)">
			</settings-battlegrounds-menu>
			<ng-container [ngSwitch]="_selectedMenu">
				<settings-battlegrounds-general *ngSwitchCase="'general'"></settings-battlegrounds-general>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBattlegroundsComponent {
	_selectedMenu: string;

	@Input() set selectedMenu(value: string) {
		this._selectedMenu = value || 'general';
	}

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

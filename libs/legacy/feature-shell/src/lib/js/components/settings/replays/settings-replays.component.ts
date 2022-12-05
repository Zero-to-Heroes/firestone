import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'settings-replays',
	styleUrls: [`../../../../css/component/settings/replays/settings-replays.component.scss`],
	template: `
		<div class="replays">
			<settings-replays-menu [selectedMenu]="_selectedMenu" (onMenuSelected)="onMenuSelected($event)">
			</settings-replays-menu>
			<ng-container [ngSwitch]="_selectedMenu">
				<settings-replays-general *ngSwitchCase="'general'"></settings-replays-general>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsReplaysComponent {
	_selectedMenu: string;
	@Input() set selectedMenu(value: string) {
		this._selectedMenu = value || 'general';
	}

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

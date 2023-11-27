import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'settings-arena',
	styleUrls: [`../../../../css/component/settings/collection/settings-collection.component.scss`],
	template: `
		<ul class="collection">
			<settings-arena-menu [selectedMenu]="_selectedMenu" (onMenuSelected)="onMenuSelected($event)">
			</settings-arena-menu>
			<ng-container [ngSwitch]="_selectedMenu">
				<settings-arena-general *ngSwitchCase="'general'"></settings-arena-general>
			</ng-container>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsArenaComponent {
	_selectedMenu: string;
	@Input() set selectedMenu(value: string) {
		this._selectedMenu = value || 'general';
	}

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

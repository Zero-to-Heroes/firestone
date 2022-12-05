import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'settings-collection',
	styleUrls: [`../../../../css/component/settings/collection/settings-collection.component.scss`],
	template: `
		<ul class="collection">
			<settings-collection-menu [selectedMenu]="_selectedMenu" (onMenuSelected)="onMenuSelected($event)">
			</settings-collection-menu>
			<ng-container [ngSwitch]="_selectedMenu">
				<settings-collection-notification *ngSwitchCase="'notification'"></settings-collection-notification>
			</ng-container>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCollectionComponent {
	_selectedMenu: string;
	@Input() set selectedMenu(value: string) {
		this._selectedMenu = value || 'notification';
	}

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

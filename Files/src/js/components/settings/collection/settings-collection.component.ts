import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'settings-collection',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/collection/settings-collection.component.scss`
	],
	template: `
		<ul class="collection">
			<settings-collection-menu 
					[selectedMenu]="selectedMenu"
					(onMenuSelected)="onMenuSelected($event)">	
			</settings-collection-menu>
			<ng-container [ngSwitch]="selectedMenu">
				<settings-collection-notification *ngSwitchCase="'notification'"></settings-collection-notification>
			</ng-container>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCollectionComponent {
	
	selectedMenu: string = 'notification';

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

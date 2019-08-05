import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'settings-general',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/general/settings-general.component.scss`,
	],
	template: `
		<ul class="general">
			<settings-general-menu [selectedMenu]="selectedMenu" (onMenuSelected)="onMenuSelected($event)"> </settings-general-menu>
			<ng-container [ngSwitch]="selectedMenu">
				<settings-general-launch *ngSwitchCase="'launch'"></settings-general-launch>
			</ng-container>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralComponent {
	selectedMenu = 'launch';

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}

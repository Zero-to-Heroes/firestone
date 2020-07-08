import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'settings-general-menu',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/general/settings-general-menu.component.scss`,
	],
	template: `
		<ul class="general-menu">
			<li [ngClass]="{ 'selected': selectedMenu === 'launch' }" (mousedown)="selectMenu('launch')">
				<span>General</span>
			</li>
			<li [ngClass]="{ 'selected': selectedMenu === 'bugreport' }" (mousedown)="selectMenu('bugreport')">
				<span>Report a bug</span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralMenuComponent {
	@Output() onMenuSelected = new EventEmitter<string>();
	@Input() selectedMenu: string;

	selectMenu(menu: string) {
		this.onMenuSelected.next(menu);
	}
}

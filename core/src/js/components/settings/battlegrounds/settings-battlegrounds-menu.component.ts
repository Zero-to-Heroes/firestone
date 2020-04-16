import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'settings-battlegrounds-menu',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/battlegrounds/settings-battlegrounds-menu.component.scss`,
	],
	template: `
		<ul class="battlegrounds-menu">
			<li [ngClass]="{ 'selected': selectedMenu === 'general' }" (mousedown)="selectMenu('general')">
				<span>General</span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBattlegroundsMenuComponent {
	@Output() onMenuSelected = new EventEmitter<string>();
	@Input() selectedMenu: string;

	selectMenu(menu: string) {
		this.onMenuSelected.next(menu);
	}
}

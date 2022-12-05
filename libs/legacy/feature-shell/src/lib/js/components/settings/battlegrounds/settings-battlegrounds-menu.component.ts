import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'settings-battlegrounds-menu',
	styleUrls: [`../../../../css/component/settings/battlegrounds/settings-battlegrounds-menu.component.scss`],
	template: `
		<ul class="battlegrounds-menu">
			<li [ngClass]="{ selected: selectedMenu === 'general' }" (mousedown)="selectMenu('general')">
				<span [owTranslate]="'settings.battlegrounds.menu.general'"></span>
			</li>
			<li [ngClass]="{ selected: selectedMenu === 'overlay' }" (mousedown)="selectMenu('overlay')">
				<span [owTranslate]="'settings.battlegrounds.menu.overlay'"></span>
			</li>
			<li [ngClass]="{ selected: selectedMenu === 'session' }" (mousedown)="selectMenu('session')">
				<span [owTranslate]="'settings.battlegrounds.menu.session'"></span>
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

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
				<span [owTranslate]="'settings.general.menu.general'"></span>
			</li>
			<li [ngClass]="{ 'selected': selectedMenu === 'localization' }" (mousedown)="selectMenu('localization')">
				<span [owTranslate]="'settings.general.menu.localization'"></span>
			</li>
			<li [ngClass]="{ 'selected': selectedMenu === 'data' }" (mousedown)="selectMenu('data')">
				<span [owTranslate]="'settings.general.menu.data'"></span>
			</li>
			<li [ngClass]="{ 'selected': selectedMenu === 'bugreport' }" (mousedown)="selectMenu('bugreport')">
				<span [owTranslate]="'settings.general.menu.bug-report'"></span>
			</li>
			<li [ngClass]="{ 'selected': selectedMenu === 'third-party' }" (mousedown)="selectMenu('third-party')">
				<span [owTranslate]="'settings.general.menu.third-party'"></span>
			</li>
			<li [ngClass]="{ 'selected': selectedMenu === 'broadcast' }" (mousedown)="selectMenu('broadcast')">
				<span [owTranslate]="'settings.general.menu.broadcast'"></span>
			</li>
			<li class="separator"></li>
			<li [ngClass]="{ 'selected': selectedMenu === 'quests' }" (mousedown)="selectMenu('quests')">
				<span [owTranslate]="'settings.general.menu.quests'"></span>
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

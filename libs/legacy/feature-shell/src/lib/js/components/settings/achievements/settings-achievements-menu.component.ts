import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'settings-achievements-menu',
	styleUrls: [`../../../../css/component/settings/achievements/settings-achievements-menu.component.scss`],
	template: `
		<ul class="achievements-menu">
			<li [ngClass]="{ selected: selectedMenu === 'notifications' }" (mousedown)="selectMenu('notifications')">
				<span [owTranslate]="'settings.achievements.menu.general'"></span>
			</li>
			<!-- <li [ngClass]="{ 'selected': selectedMenu === 'live' }" (mousedown)="selectMenu('live')">
				<span>Live tracking</span>
			</li> -->
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsMenuComponent {
	@Output() onMenuSelected = new EventEmitter<string>();
	@Input() selectedMenu: string;

	selectMenu(menu: string) {
		this.onMenuSelected.next(menu);
	}
}

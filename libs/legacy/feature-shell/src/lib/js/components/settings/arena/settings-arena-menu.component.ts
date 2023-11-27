import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'settings-arena-menu',
	styleUrls: [`../../../../css/component/settings/collection/settings-collection-menu.component.scss`],
	template: `
		<ul class="collection-menu">
			<li [ngClass]="{ selected: selectedMenu === 'general' }" (mousedown)="selectMenu('general')">
				<span [owTranslate]="'settings.arena.menu.general'"></span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsArenaMenuComponent {
	@Output() onMenuSelected = new EventEmitter<string>();
	@Input() selectedMenu: string;

	selectMenu(menu: string) {
		this.onMenuSelected.next(menu);
	}
}

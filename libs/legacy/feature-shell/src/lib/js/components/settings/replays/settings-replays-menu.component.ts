import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'settings-replays-menu',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/replays/settings-replays-menu.component.scss`,
	],
	template: `
		<ul class="replays-menu">
			<li [ngClass]="{ 'selected': selectedMenu === 'general' }" (mousedown)="selectMenu('general')">
				<span [owTranslate]="'settings.replays.menu.general'"></span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsReplaysMenuComponent {
	@Output() onMenuSelected = new EventEmitter<string>();
	@Input() selectedMenu: string;

	selectMenu(menu: string) {
		this.onMenuSelected.next(menu);
	}
}

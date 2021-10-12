import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'settings-mercenaries-menu',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/mercenaries/settings-mercenaries-menu.component.scss`,
	],
	template: `
		<ul class="mercenaries-menu">
			<li [ngClass]="{ 'selected': selectedMenu === 'general' }" (mousedown)="selectMenu('general')">
				<span>General</span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsMercenariesMenuComponent {
	@Output() onMenuSelected = new EventEmitter<string>();
	@Input() selectedMenu: string;

	selectMenu(menu: string) {
		this.onMenuSelected.next(menu);
	}
}

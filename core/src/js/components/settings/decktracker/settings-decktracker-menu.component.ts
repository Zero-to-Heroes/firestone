import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'settings-decktracker-menu',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-menu.component.scss`,
	],
	template: `
		<ul class="decktracker-menu">
			<li [ngClass]="{ 'selected': selectedMenu === 'your-deck' }" (mousedown)="selectMenu('your-deck')">
				<span>Your deck</span>
			</li>
			<li [ngClass]="{ 'selected': selectedMenu === 'opponent-deck' }" (mousedown)="selectMenu('opponent-deck')">
				<span>Opponent's deck</span>
			</li>
			<li [ngClass]="{ 'selected': selectedMenu === 'global' }" (mousedown)="selectMenu('global')">
				<span>Global options</span>
			</li>
			<li [ngClass]="{ 'selected': selectedMenu === 'launch' }" (mousedown)="selectMenu('launch')">
				<span>Launch options</span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerMenuComponent {
	@Output() onMenuSelected = new EventEmitter<string>();
	@Input() selectedMenu: string;

	selectMenu(menu: string) {
		this.onMenuSelected.next(menu);
	}
}

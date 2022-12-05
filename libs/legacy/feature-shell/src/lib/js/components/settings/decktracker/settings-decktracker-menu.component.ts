import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'settings-decktracker-menu',
	styleUrls: [`../../../../css/component/settings/decktracker/settings-decktracker-menu.component.scss`],
	template: `
		<ul class="decktracker-menu">
			<li [ngClass]="{ selected: selectedMenu === 'global' }" (mousedown)="selectMenu('global')">
				<span [owTranslate]="'settings.decktracker.menu.global'"></span>
			</li>
			<li [ngClass]="{ selected: selectedMenu === 'your-deck' }" (mousedown)="selectMenu('your-deck')">
				<span [owTranslate]="'settings.decktracker.menu.your-deck'"></span>
			</li>
			<li [ngClass]="{ selected: selectedMenu === 'opponent-deck' }" (mousedown)="selectMenu('opponent-deck')">
				<span [owTranslate]="'settings.decktracker.menu.opponent-deck'"></span>
			</li>
			<li [ngClass]="{ selected: selectedMenu === 'turn-timer' }" (mousedown)="selectMenu('turn-timer')">
				<span [owTranslate]="'settings.decktracker.menu.turn-timer'"></span>
			</li>
			<li [ngClass]="{ selected: selectedMenu === 'duels' }" (mousedown)="selectMenu('duels')">
				<span [owTranslate]="'settings.decktracker.menu.duels'"></span>
			</li>
			<li [ngClass]="{ selected: selectedMenu === 'launch' }" (mousedown)="selectMenu('launch')">
				<span [owTranslate]="'settings.decktracker.menu.launch'"></span>
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

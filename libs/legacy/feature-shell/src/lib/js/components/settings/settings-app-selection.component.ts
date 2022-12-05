import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'settings-app-selection',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/settings/settings-app-selection.component.scss`,
	],
	template: `
		<ul class="menu-selection">
			<li [ngClass]="{ selected: selectedApp === 'general' }" (mousedown)="changeSelection('general')">
				<span [owTranslate]="'settings.menu.general'"></span>
			</li>
			<li [ngClass]="{ selected: selectedApp === 'decktracker' }" (mousedown)="changeSelection('decktracker')">
				<span [owTranslate]="'settings.menu.decktracker'"></span>
			</li>
			<li
				[ngClass]="{ selected: selectedApp === 'battlegrounds' }"
				(mousedown)="changeSelection('battlegrounds')"
			>
				<span [owTranslate]="'settings.menu.battlegrounds'"></span>
			</li>
			<li [ngClass]="{ selected: selectedApp === 'mercenaries' }" (mousedown)="changeSelection('mercenaries')">
				<span [owTranslate]="'settings.menu.mercenaries'"></span>
			</li>
			<li [ngClass]="{ selected: selectedApp === 'replays' }" (mousedown)="changeSelection('replays')">
				<span [owTranslate]="'settings.menu.replays'"></span>
			</li>
			<li [ngClass]="{ selected: selectedApp === 'collection' }" (mousedown)="changeSelection('collection')">
				<span [owTranslate]="'settings.menu.collection'"></span>
			</li>
			<li [ngClass]="{ selected: selectedApp === 'achievements' }" (mousedown)="changeSelection('achievements')">
				<span [owTranslate]="'settings.menu.achievements'"></span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAppSelectionComponent {
	@Input() selectedApp = 'general';
	@Output() onAppSelected = new EventEmitter<string>();

	changeSelection(selection: string) {
		this.selectedApp = selection;
		this.onAppSelected.next(selection);
	}
}

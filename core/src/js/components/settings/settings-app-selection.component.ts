import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'settings-app-selection',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/global/menu.scss`,
		`../../../css/component/settings/settings-app-selection.component.scss`,
	],
	template: `
		<ul class="menu-selection">
			<li [ngClass]="{ 'selected': selectedApp === 'general' }" (mousedown)="changeSelection('general')">
				<span>General</span>
			</li>
			<li [ngClass]="{ 'selected': selectedApp === 'decktracker' }" (mousedown)="changeSelection('decktracker')">
				<span>Deck Tracker</span>
			</li>
			<li
				[ngClass]="{ 'selected': selectedApp === 'battlegrounds' }"
				(mousedown)="changeSelection('battlegrounds')"
			>
				<span>Battlegrounds</span>
			</li>
			<li [ngClass]="{ 'selected': selectedApp === 'mercenaries' }" (mousedown)="changeSelection('mercenaries')">
				<span>Mercenaries</span>
			</li>
			<li [ngClass]="{ 'selected': selectedApp === 'replays' }" (mousedown)="changeSelection('replays')">
				<span>Replays</span>
			</li>
			<li [ngClass]="{ 'selected': selectedApp === 'collection' }" (mousedown)="changeSelection('collection')">
				<span>Collection</span>
			</li>
			<li
				[ngClass]="{ 'selected': selectedApp === 'achievements' }"
				(mousedown)="changeSelection('achievements')"
			>
				<span>Achievements</span>
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

import { Component, ViewEncapsulation, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';

@Component({
	selector: 'settings-app-selection',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/global/menu.scss`,
		`../../../css/component/settings/settings-app-selection.component.scss`
	],
	template: `
        <ul class="menu-selection">
            <li [ngClass]="{'selected': selectedApp == 'general'}">
                <span (click)="changeSelection('general')">General</span>
            </li>
            <li [ngClass]="{'selected': selectedApp == 'collection'}">
                <span (click)="changeSelection('collection')">The Binder</span>
            </li>
            <li [ngClass]="{'selected': selectedApp == 'achievements'}">
                <span (click)="changeSelection('achievements')">Achievements</span>
            </li>
            <li [ngClass]="{'selected': selectedApp == 'decktracker'}">
                <span (click)="changeSelection('decktracker')">Deck Tracker</span>
            </li>
        </ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAppSelectionComponent {

    @Input() selectedApp: string = 'general';
    @Output() onAppSelected = new EventEmitter<string>();

    changeSelection(selection: string) {
        this.selectedApp = selection;
        this.onAppSelected.next(selection);
    }
}

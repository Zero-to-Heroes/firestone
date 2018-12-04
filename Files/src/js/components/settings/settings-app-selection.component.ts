import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'settings-app-selection',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/global/menu.scss`,
		`../../../css/component/settings/settings-app-selection.component.scss`
	],
	template: `
        <ul class="menu-selection">
            <li class="disabled">
                <span>The Binder</span>
            </li>
            <li [ngClass]="{'selected': selectedApp == 'achievements'}">
                <span>Achievements</span>
            </li>
            <li class="disabled">
                <span>Deck Tracker</span>
            </li>
        </ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAppSelectionComponent {

    selectedApp: string = 'achievements';
}

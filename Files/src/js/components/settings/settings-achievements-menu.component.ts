import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'settings-achievements-menu',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings-achievements-menu.component.scss`
	],
	template: `
        <ul class="achievements-menu">
            <li [ngClass]="{'selected': selectedMenu === 'capture'}">
                <span>Capture</span>
            </li>
            <li [ngClass]="{'selected': selectedMenu === 'storage'}">
                <span>Storage</span>
            </li>
        </ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsMenuComponent {

    selectedMenu: string = 'capture';
}

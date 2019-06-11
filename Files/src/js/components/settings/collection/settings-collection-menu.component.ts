import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

@Component({
	selector: 'settings-collection-menu',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/collection/settings-collection-menu.component.scss`
	],
	template: `
        <ul class="collection-menu">
            <li [ngClass]="{'selected': selectedMenu === 'notification'}" (mousedown)="selectMenu('notification')">
                <span>Notifications</span>
            </li>
        </ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCollectionMenuComponent {

    @Output() onMenuSelected = new EventEmitter<string>();
    @Input() selectedMenu: string;

    selectMenu(menu: string) {
        this.onMenuSelected.next(menu);
    }
}

import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

@Component({
	selector: 'settings-decktracker-menu',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-menu.component.scss`
	],
	template: `
        <ul class="decktracker-menu">
            <li [ngClass]="{'selected': selectedMenu === 'launch'}" (click)="selectMenu('launch')">
                <span>Launch options</span>
            </li>
            <li [ngClass]="{'selected': selectedMenu === 'appearance'}" (click)="selectMenu('appearance')">
                <span>Look and feel</span>
            </li>
            <li [ngClass]="{'selected': selectedMenu === 'broadcast'}" (click)="selectMenu('broadcast')">
                <span>Broadcast</span>
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

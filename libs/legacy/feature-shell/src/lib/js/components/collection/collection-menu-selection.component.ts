import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CurrentView } from '@firestone/collection/common';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { CollectionSelectCurrentTabEvent } from '@firestone/mainwindow/common';

@Component({
	standalone: false,
	selector: 'collection-menu-selection',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/menu-selection.component.scss`,
		`../../../css/component/collection/collection-menu-selection.component.scss`,
	],
	template: `
		<ul class="menu-selection">
			<li [ngClass]="{ selected: selectedTab === 'sets' }" (mousedown)="selectTab('sets')">
				<span [owTranslate]="'app.collection.menu.sets'"></span>
			</li>
			<li [ngClass]="{ selected: selectedTab === 'card-backs' }" (mousedown)="selectTab('card-backs')">
				<span [owTranslate]="'app.collection.menu.card-backs'"></span>
			</li>
			<li [ngClass]="{ selected: selectedTab === 'hero-portraits' }" (mousedown)="selectTab('hero-portraits')">
				<span [owTranslate]="'app.collection.menu.portraits'"></span>
			</li>
			<li [ngClass]="{ selected: selectedTab === 'coins' }" (mousedown)="selectTab('coins')">
				<span [owTranslate]="'app.collection.menu.coins'"></span>
			</li>
			<li [ngClass]="{ selected: selectedTab === 'packs' }" (mousedown)="selectTab('packs')">
				<span [owTranslate]="'app.collection.menu.packs'"></span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionMenuSelectionComponent {
	@Input() selectedTab: CurrentView;

	constructor(private readonly mainWindowStateFacade: MainWindowStateFacadeService) {}

	selectTab(stage: CurrentView) {
		this.mainWindowStateFacade.send(new CollectionSelectCurrentTabEvent(stage));
	}
}

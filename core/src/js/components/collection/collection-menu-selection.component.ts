import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { CurrentView } from '../../models/mainwindow/collection/current-view.type';
import { CollectionSelectCurrentTabEvent } from '../../services/mainwindow/store/events/collection/collection-select-current-tab-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

declare let amplitude;

@Component({
	selector: 'collection-menu-selection',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/menu-selection.component.scss`,
		`../../../css/component/collection/collection-menu-selection.component.scss`,
	],
	template: `
		<ul class="menu-selection">
			<li [ngClass]="{ 'selected': selectedTab === 'sets' }" (mousedown)="selectTab('sets')">
				<span>Cards</span>
			</li>
			<li [ngClass]="{ 'selected': selectedTab === 'card-backs' }" (mousedown)="selectTab('card-backs')">
				<span>Card Backs</span>
			</li>
			<li [ngClass]="{ 'selected': selectedTab === 'hero-portraits' }" (mousedown)="selectTab('hero-portraits')">
				<span>Portraits</span>
			</li>
			<li [ngClass]="{ 'selected': selectedTab === 'coins' }" (mousedown)="selectTab('coins')">
				<span>Coins</span>
			</li>
			<li [ngClass]="{ 'selected': selectedTab === 'packs' }" (mousedown)="selectTab('packs')">
				<span>Packs</span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionMenuSelectionComponent implements AfterViewInit {
	@Input() selectedTab: CurrentView;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectTab(stage: CurrentView) {
		this.stateUpdater.next(new CollectionSelectCurrentTabEvent(stage));
	}
}

import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Set } from '../../models/set';
import { SelectCollectionSetEvent } from '../../services/mainwindow/store/events/collection/select-collection-set-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';

@Component({
	selector: 'set',
	styleUrls: [`../../../css/component/collection/set.component.scss`],
	template: `
		<set-view
			*ngIf="_cardSet"
			class="set"
			[setId]="_cardSet.id"
			[released]="released"
			[collectedCards]="_cardSet.ownedLimitCollectibleCards"
			[collectableCards]="_cardSet.numberOfLimitCollectibleCards()"
			[collectedCardsGolden]="collectedCardsGolden"
			(setClicked)="browseSet($event)"
		>
		</set-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetComponent implements AfterViewInit {
	@Input() set cardSet(set: Set) {
		this._cardSet = set;
		this.released = set.allCards && set.allCards.length > 0;
		this.collectedCardsGolden = this._cardSet.allCards
			.map((card) => card.getNumberCollectedPremium())
			.reduce((c1, c2) => c1 + c2, 0);
	}

	_cardSet: Set;
	released = true;
	collectedCardsGolden: number;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	browseSet(setId: string) {
		if (!this.released) {
			return;
		}
		this.stateUpdater.next(new SelectCollectionSetEvent(setId));
	}
}

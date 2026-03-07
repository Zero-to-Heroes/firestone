import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Set } from '@firestone/collection/common';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { SelectCollectionSetEvent } from '@firestone/mainwindow/common';

@Component({
	standalone: false,
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
export class SetComponent {
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

	constructor(private readonly mainWindowStateFacade: MainWindowStateFacadeService) {}

	browseSet(setId: string) {
		if (!this.released) {
			return;
		}
		this.mainWindowStateFacade.send(new SelectCollectionSetEvent(setId));
	}
}

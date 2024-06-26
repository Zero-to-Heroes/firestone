import { CollectionNavigationService } from '@firestone/collection/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Set } from '../../../../../models/set';
import { SetsManagerService } from '../../../../collection/sets-manager.service';
import { ShowCardDetailsEvent } from '../../events/collection/show-card-details-event';
import { Processor } from '../processor';

export class ShowCardDetailsProcessor implements Processor {
	constructor(
		private readonly cards: CardsFacadeService,
		private readonly setsManager: SetsManagerService,
		private readonly collectionNav: CollectionNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: ShowCardDetailsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const allSets = await this.setsManager.sets$$.getValueWithInit();
		const selectedSet: Set = this.pickSet(allSets, event.cardId);
		const referenceCard = this.cards.getCard(event.cardId);
		this.collectionNav.currentView$$.next('card-details');
		this.collectionNav.menuDisplayType$$.next('breadcrumbs');
		this.collectionNav.searchString$$.next(null);
		this.collectionNav.selectedSetId$$.next(selectedSet?.id);
		this.collectionNav.selectedCardId$$.next(event.cardId);
		this.collectionNav.selectedCardBackId$$.next(null);
		const newCollection = navigationState.navigationCollection.update({
			searchResults: [] as readonly string[],
		} as NavigationCollection);

		this.mainNav.text$$.next(referenceCard.name);
		this.mainNav.image$$.next(null);
		this.mainNav.isVisible$$.next(true);
		this.mainNav.currentApp$$.next('collection');
		return [
			null,
			navigationState.update({
				navigationCollection: newCollection,
			} as NavigationState),
		];
	}

	private pickSet(allSets: readonly Set[], cardId: string): Set {
		let set = allSets.find((set) => !!set.getCard(cardId));
		// Happens when cardId is not collectible
		if (!set) {
			const card = this.cards.getCard(cardId);
			const setId = card.set.toLowerCase();
			set = allSets.find((set) => set.id === setId);
		}
		return set;
	}
}

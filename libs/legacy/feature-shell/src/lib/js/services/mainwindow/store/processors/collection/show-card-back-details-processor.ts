import { CollectionNavigationService } from '@firestone/collection/common';
import { CardBack } from '@firestone/memory';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CollectionManager } from '../../../../collection/collection-manager.service';
import { ShowCardBackDetailsEvent } from '../../events/collection/show-card-back-details-event';
import { Processor } from '../processor';

export class ShowCardBackDetailsProcessor implements Processor {
	constructor(
		private readonly collectionManager: CollectionManager,
		private readonly collectionNav: CollectionNavigationService,
	) {}

	public async process(
		event: ShowCardBackDetailsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const cardBacks = await this.collectionManager.cardBacks$$.getValueWithInit();
		const selectedCardBack: CardBack = cardBacks.find((cardBack) => cardBack.id === event.cardBackId);

		this.collectionNav.currentView$$.next('card-back-details');

		const newCollection = navigationState.navigationCollection.update({
			menuDisplayType: 'breadcrumbs',
			selectedCardId: undefined,
			selectedCardBackId: event.cardBackId,
			searchString: undefined,
			searchResults: [] as readonly string[],
		} as NavigationCollection);
		return [
			null,
			navigationState.update({
				isVisible: true,
				currentApp: 'collection',
				navigationCollection: newCollection,
				text: selectedCardBack.name,
				image: null,
			} as NavigationState),
		];
	}
}

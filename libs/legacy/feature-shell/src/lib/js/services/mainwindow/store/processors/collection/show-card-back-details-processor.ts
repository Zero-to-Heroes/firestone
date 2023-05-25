import { CardBack } from '../../../../../models/card-back';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CollectionManager } from '../../../../collection/collection-manager.service';
import { ShowCardBackDetailsEvent } from '../../events/collection/show-card-back-details-event';
import { Processor } from '../processor';

export class ShowCardBackDetailsProcessor implements Processor {
	constructor(private readonly collectionManager: CollectionManager) {}
	public async process(
		event: ShowCardBackDetailsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const selectedCardBack: CardBack = this.collectionManager.cardBacks$$
			.getValue()
			.find((cardBack) => cardBack.id === event.cardBackId);
		const newCollection = navigationState.navigationCollection.update({
			currentView: 'card-back-details',
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

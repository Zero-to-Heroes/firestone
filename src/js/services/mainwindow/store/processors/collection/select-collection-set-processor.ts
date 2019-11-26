import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { Navigation } from '../../../../../models/mainwindow/navigation';
import { Set } from '../../../../../models/set';
import { SelectCollectionSetEvent } from '../../events/collection/select-collection-set-event';
import { Processor } from '../processor';

export class SelectCollectionSetProcessor implements Processor {
	public async process(event: SelectCollectionSetEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const selectedSet: Set = currentState.binder.allSets.find(set => set.id === event.setId);
		const newBinder = Object.assign(new BinderState(), currentState.binder, {
			currentView: 'cards',
			menuDisplayType: 'breadcrumbs',
			selectedSet: selectedSet,
			selectedFormat: selectedSet.standard ? 'standard' : 'wild',
			cardList: selectedSet.allCards,
			searchString: undefined,
			selectedCard: undefined,
		} as BinderState);
		const navigation = Object.assign(new Navigation(), currentState.navigation, {
			text: selectedSet.name,
			image: `/Files/assets/images/sets/${selectedSet.id}.png`,
		} as Navigation);
		return Object.assign(new MainWindowState(), currentState, {
			isVisible: true,
			currentApp: 'collection',
			binder: newBinder,
			navigation: navigation,
		} as MainWindowState);
	}
}

import { AllCardsService } from '@firestone-hs/replay-parser';
import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { Navigation } from '../../../../../models/mainwindow/navigation';
import { Set, SetCard } from '../../../../../models/set';
import { ShowCardDetailsEvent } from '../../events/collection/show-card-details-event';
import { Processor } from '../processor';

export class ShowCardDetailsProcessor implements Processor {
	constructor(private cards: AllCardsService) {}

	public async process(event: ShowCardDetailsEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const selectedSet: Set = this.pickSet(currentState.binder.allSets, event.cardId);
		const selectedCard: SetCard = this.pickCard(selectedSet, event.cardId);
		const newBinder = Object.assign(new BinderState(), currentState.binder, {
			currentView: 'card-details',
			menuDisplayType: 'breadcrumbs',
			selectedSet: selectedSet,
			selectedCard: selectedCard,
			selectedFormat: selectedSet.standard ? 'standard' : 'wild',
			searchString: undefined,
		} as BinderState);
		const navigation = Object.assign(new Navigation(), currentState.navigation, {
			text: selectedCard.name,
			image: null,
		} as Navigation);
		return Object.assign(new MainWindowState(), currentState, {
			isVisible: true,
			currentApp: 'collection',
			binder: newBinder,
			navigation: navigation,
		} as MainWindowState);
	}

	private pickCard(selectedSet: Set, cardId: string): SetCard {
		let card = selectedSet.allCards.find(card => card.id === cardId);
		if (!card) {
			const rawCard = this.cards.getCard(cardId);
			card = new SetCard(cardId, rawCard.name, rawCard.playerClass, rawCard.rarity, rawCard.cost, 0, 0);
		}
		return card;
	}

	private pickSet(allSets: readonly Set[], cardId: string): Set {
		let set = allSets.find(set => set.allCards.some(card => card.id === cardId));
		// Happens when cardId is not collectible
		if (!set) {
			const card = this.cards.getCard(cardId);
			const setId = card.set.toLowerCase();
			set = allSets.find(set => set.id === setId);
		}
		return set;
	}
}

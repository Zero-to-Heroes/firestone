import { Processor } from "../processor";
import { MainWindowState } from "../../../../../models/mainwindow/main-window-state";
import { BinderState } from "../../../../../models/mainwindow/binder-state";
import { UpdateCardSearchResultsEvent } from "../../events/collection/update-card-search-results-event";
import { CollectionManager } from "../../../../collection/collection-manager.service";
import { AllCardsService } from "../../../../all-cards.service";
import { SetCard } from "../../../../../models/set";
import { Card } from "../../../../../models/card";

export class UpdateCardSearchResultsProcessor implements Processor {

    constructor(private collectionManager: CollectionManager, private cards: AllCardsService) { }

    public async process(event: UpdateCardSearchResultsEvent, currentState: MainWindowState): Promise<MainWindowState> {
        const collection = await this.collectionManager.getCollection();
        const searchResults: ReadonlyArray<SetCard> = this.cards.searchCards(event.searchString)
                .map((card) => {
                    let collectionCard: Card = this.findCollectionCard(collection, card);
                    return new SetCard(
                        card.id, 
                        card.name, 
                        card.cardClass,
                        card.rarity, 
                        card.cost,
                        collectionCard ? collectionCard.count : 0, 
                        collectionCard ? collectionCard.premiumCount : 0)
                });
        const newBinder = Object.assign(new BinderState(), currentState.binder, {
            searchResults: searchResults,
        } as BinderState)
        return Object.assign(new MainWindowState(), currentState, {
            binder: newBinder,
        } as MainWindowState)
    }

	private findCollectionCard(collection: Card[], card: SetCard): Card {
		for (let i = 0; i < collection.length; i++) {
			let collectionCard = collection[i];
			if (collectionCard.id == card.id) {
				return collectionCard;
			}
		}
		return null;
	}
}
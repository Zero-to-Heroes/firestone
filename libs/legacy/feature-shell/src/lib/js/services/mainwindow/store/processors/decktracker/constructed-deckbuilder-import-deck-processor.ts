import { DeckDefinition, decode } from '@firestone-hs/deckstrings';
import { formatFormat } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedDeckbuilderImportDeckEvent } from '../../events/decktracker/constructed-deckbuilder-import-deck-event';

export class ConstructedDeckbuilderImportDeckProcessor implements Processor {
	constructor(private readonly allCards: CardsFacadeService) {}

	public async process(
		event: ConstructedDeckbuilderImportDeckEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		let deckDefinition: DeckDefinition = null;
		try {
			deckDefinition = decode(event.deckstring);
		} catch (e) {
			console.warn('Could not decode deckstring', event.deckstring, event.deckName, e);
			return [null, null];
		}
		console.debug('importing', deckDefinition, event);

		return [
			currentState.update({
				decktracker: currentState.decktracker.update({
					deckbuilder: currentState.decktracker.deckbuilder.update({
						currentFormat: formatFormat(deckDefinition.format),
						currentClass: this.allCards
							.getCardFromDbfId(deckDefinition.heroes[0])
							.playerClass?.toLowerCase(),
						currentCards: deckDefinition.cards.flatMap((card) =>
							new Array(card[1]).fill(this.allCards.getCardFromDbfId(card[0]).id),
						),
						sideboards: deckDefinition.sideboards,
					}),
				}),
			}),
			null,
		];
	}
}

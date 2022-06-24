import { formatFormat } from '@firestone-hs/reference-data';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { decode } from 'deckstrings';
import { CardsFacadeService } from '../../../../cards-facade.service';
import { ConstructedDeckbuilderImportDeckEvent } from '../../events/decktracker/constructed-deckbuilder-import-deck-event';

export class ConstructedDeckbuilderImportDeckProcessor implements Processor {
	constructor(private readonly allCards: CardsFacadeService) {}

	public async process(
		event: ConstructedDeckbuilderImportDeckEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const deckDefinition = decode(event.deckstring);
		console.debug('parsed deck from clipboard', deckDefinition);
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
					}),
				}),
			}),
			null,
		];
	}
}

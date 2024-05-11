import { DeckDefinition, decode } from '@firestone-hs/deckstrings';
import { CardClass, duelsHeroConfigs, normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { DuelsDeckbuilderImportDeckEvent } from '../../events/duels/duels-deckbuilder-import-deck-event';

export class DuelsDeckbuilderImportDeckProcessor implements Processor {
	constructor(private readonly allCards: CardsFacadeService) {}

	public async process(
		event: DuelsDeckbuilderImportDeckEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		let deckDefinition: DeckDefinition = null;
		try {
			deckDefinition = decode(event.deckstring);
		} catch (e) {
			console.warn('Could not decode deckstring', event.deckstring, event.deckName, e);
			return [null, null];
		}

		const inputHeroCardId = this.allCards.getCardFromDbfId(deckDefinition.heroes[0]).id;
		const config =
			duelsHeroConfigs.find(
				(config) => normalizeDuelsHeroCardId(config.hero) === normalizeDuelsHeroCardId(inputHeroCardId),
			) ??
			// Deck codes can have a non-duels class as their hero
			duelsHeroConfigs.find(
				(config) =>
					this.allCards.getCard(config.hero).playerClass ===
					this.allCards.getCard(inputHeroCardId).playerClass,
			);
		const heroCardId = config?.hero;
		const classes: CardClass[] = this.allCards.getCard(config.hero)?.classes?.map((c) => CardClass[c]) ?? [];
		const cards = deckDefinition.cards.flatMap((card) =>
			new Array(card[1]).fill(this.allCards.getCardFromDbfId(card[0]).id),
		);
		const newDuelsState = currentState.duels.update({
			deckbuilder: currentState.duels.deckbuilder.update({
				currentHeroCardId: heroCardId,
				currentClasses: classes,
				currentCards: cards,
			}),
		});
		return [
			currentState.update({
				duels: newDuelsState,
			}),
			null,
		];
	}
}

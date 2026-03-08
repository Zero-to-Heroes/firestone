import { DeckSummary } from '@firestone/constructed/common';

/**
 * Minimal interface for SelectDeckDetailsProcessor to avoid circular dependency
 * with decktracker/common. DecksProviderService implements this.
 */
export interface ISelectDeckDetailsDecksProvider {
	readonly decks$$: { getValueWithInit(): Promise<readonly DeckSummary[]> };
}

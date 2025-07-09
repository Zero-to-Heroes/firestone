import { Injectable } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export interface CompositionMatch {
	composition: BgsCompAdvice;
	confidence: number;
	coreCardsFound: string[];
	addonCardsFound: string[];
	missingCoreCards: string[];
	missingAddonCards: string[];
}

export interface PlayerCards {
	board: string[]; // card IDs
	hand: string[]; // card IDs
}

@Injectable()
export class CompositionDetectorService {
	constructor(private readonly allCards: CardsFacadeService) {}

	/**
	 * Detects the most likely composition the player is playing based on their board and hand
	 * @param playerCards - The player's board and hand cards
	 * @param availableCompositions - List of all available compositions to match against
	 * @returns The best matching composition or null if no good match is found
	 */
	detectComposition(
		playerCards: PlayerCards,
		availableCompositions: readonly BgsCompAdvice[],
	): CompositionMatch | null {
		if (!playerCards.board.length && !playerCards.hand.length) {
			return null;
		}

		const allPlayerCardIds = [...playerCards.board, ...playerCards.hand];
		const normalizedPlayerCardIds = this.normalizeCardIds(allPlayerCardIds);

		const matches: CompositionMatch[] = availableCompositions
			.map((comp) => this.calculateCompositionMatch(comp, normalizedPlayerCardIds))
			.filter((match): match is CompositionMatch => match != null)
			.filter((match) => {
				// Require either multiple core cards OR at least one core + one addon card
				// This prevents false positives from single utility cards
				const hasMultipleCoreCards = match.coreCardsFound.length >= 2;
				const hasCoreAndAddon = match.coreCardsFound.length >= 1 && match.addonCardsFound.length >= 1;
				const hasMinimumRequirement = hasMultipleCoreCards || hasCoreAndAddon;

				return match.confidence > 0 && hasMinimumRequirement;
			})
			.sort((a, b) => b.confidence - a.confidence);

		// Return the best match if it has sufficient confidence
		const bestMatch = matches[0];
		if (bestMatch && bestMatch.confidence >= 0.3) {
			return bestMatch;
		}

		return null;
	}

	/**
	 * Gets multiple possible compositions the player might be building towards
	 * @param playerCards - The player's board and hand cards
	 * @param availableCompositions - List of all available compositions to match against
	 * @param maxResults - Maximum number of results to return
	 * @returns Array of composition matches sorted by confidence
	 */
	getPossibleCompositions(
		playerCards: PlayerCards,
		availableCompositions: readonly BgsCompAdvice[],
		maxResults: number = 5,
	): CompositionMatch[] {
		if (!playerCards.board.length && !playerCards.hand.length) {
			return [];
		}

		const allPlayerCardIds = [...playerCards.board, ...playerCards.hand];
		const normalizedPlayerCardIds = this.normalizeCardIds(allPlayerCardIds);

		return availableCompositions
			.map((comp) => this.calculateCompositionMatch(comp, normalizedPlayerCardIds))
			.filter((match): match is CompositionMatch => match != null)
			.filter((match) => {
				// Require either multiple core cards OR at least one core + one addon card
				// This prevents false positives from single utility cards
				const hasMultipleCoreCards = match.coreCardsFound.length >= 2;
				const hasCoreAndAddon = match.coreCardsFound.length >= 1 && match.addonCardsFound.length >= 1;
				const hasMinimumRequirement = hasMultipleCoreCards || hasCoreAndAddon;

				return match.confidence > 0 && hasMinimumRequirement;
			})
			.filter((match) => match.confidence > 0.3) // Lower threshold for suggestions
			.sort((a, b) => b.confidence - a.confidence)
			.slice(0, maxResults);
	}

	private calculateCompositionMatch(composition: BgsCompAdvice, playerCardIds: string[]): CompositionMatch | null {
		const coreCards = composition.cards.filter((card) => card.status === 'CORE');
		const addonCards = composition.cards.filter((card) => card.status === 'ADDON');

		const coreCardsFound = coreCards
			.filter((card) => playerCardIds.includes(card.cardId))
			.map((card) => card.cardId);
		const addonCardsFound = addonCards
			.filter((card) => playerCardIds.includes(card.cardId))
			.map((card) => card.cardId);

		const missingCoreCards = coreCards
			.filter((card) => !playerCardIds.includes(card.cardId))
			.map((card) => card.cardId);
		const missingAddonCards = addonCards
			.filter((card) => !playerCardIds.includes(card.cardId))
			.map((card) => card.cardId);

		// Calculate confidence based on:
		// 1. Core cards found (weighted heavily)
		// 2. Addon cards found (weighted moderately)
		// 3. Total composition size (smaller compositions get higher confidence for same match ratio)
		const coreRatio = coreCards.length > 0 ? coreCardsFound.length / coreCards.length : 0;
		const addonRatio = addonCards.length > 0 ? addonCardsFound.length / addonCards.length : 0;

		// Return null if no cards found at all
		if (coreCardsFound.length === 0 && addonCardsFound.length === 0) {
			return null;
		}

		// Core cards are much more important than addon cards
		const coreWeight = 0.7;
		const addonWeight = 0.3;

		let confidence = coreRatio * coreWeight + addonRatio * addonWeight;

		// Bonus for having at least some core cards
		if (coreCardsFound.length > 0) {
			confidence += 0.1;
		}

		// Penalty for very large compositions with few matches
		const totalCompositionSize = coreCards.length + addonCards.length;
		if (totalCompositionSize > 10 && coreCardsFound.length + addonCardsFound.length < 3) {
			confidence *= 0.5;
		}

		// Bonus for having a good mix of core and addon cards
		if (coreCardsFound.length >= 2 && addonCardsFound.length >= 2) {
			confidence += 0.1;
		}

		// Cap confidence at 1.0
		confidence = Math.min(confidence, 1.0);

		return {
			composition,
			confidence,
			coreCardsFound,
			addonCardsFound,
			missingCoreCards,
			missingAddonCards,
		};
	}

	/**
	 * Normalizes card IDs to handle golden cards and other variations
	 * @param cardIds - Array of card IDs to normalize
	 * @returns Array of normalized card IDs
	 */
	private normalizeCardIds(cardIds: string[]): string[] {
		return cardIds.map((cardId) => {
			const card = this.allCards.getCard(cardId);
			// Use the base card ID for golden cards
			return card?.battlegroundsNormalDbfId
				? this.allCards.getCard(card.battlegroundsNormalDbfId)?.id || cardId
				: cardId;
		});
	}

	/**
	 * Gets detailed information about a composition match
	 * @param match - The composition match to analyze
	 * @returns Detailed analysis of the match
	 */
	getMatchAnalysis(match: CompositionMatch | null): {
		summary: string;
		strengths: string[];
		weaknesses: string[];
		nextSteps: string[];
	} | null {
		if (!match) {
			return null;
		}
		const { composition, confidence, coreCardsFound, addonCardsFound, missingCoreCards, missingAddonCards } = match;

		const strengths: string[] = [];
		const weaknesses: string[] = [];
		const nextSteps: string[] = [];

		// Analyze strengths
		if (coreCardsFound.length >= 2) {
			strengths.push(`Strong core with ${coreCardsFound.length} core cards`);
		}
		if (addonCardsFound.length >= 2) {
			strengths.push(`Good support with ${addonCardsFound.length} addon cards`);
		}
		if (confidence >= 0.7) {
			strengths.push('High confidence match');
		}

		// Analyze weaknesses
		if (missingCoreCards.length > 0) {
			weaknesses.push(`Missing ${missingCoreCards.length} core cards`);
		}
		if (coreCardsFound.length === 0) {
			weaknesses.push('No core cards found');
		}
		if (confidence < 0.5) {
			weaknesses.push('Low confidence match');
		}

		// Suggest next steps
		if (missingCoreCards.length > 0) {
			nextSteps.push(`Look for missing core cards: ${missingCoreCards.slice(0, 3).join(', ')}`);
		}
		if (
			addonCardsFound.length < 2 &&
			addonCardsFound.length < match.composition.cards.filter((c) => c.status === 'ADDON').length
		) {
			nextSteps.push('Add more support cards to strengthen the composition');
		}

		const summary = `Confidence: ${Math.round(confidence * 100)}% - ${coreCardsFound.length} core, ${
			addonCardsFound.length
		} addon cards`;

		return {
			summary,
			strengths,
			weaknesses,
			nextSteps,
		};
	}
}

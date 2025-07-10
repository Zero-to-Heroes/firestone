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
	// Add debugging info for the new weighting system
	weightedScore?: number;
	cardWeights?: { [cardId: string]: number };
	// Cards that don't belong to this composition at all
	foreignCards?: string[];
	foreignCardsPenalty?: number;
}

export interface PlayerCards {
	board: string[]; // card IDs
	hand: string[]; // card IDs
}

@Injectable()
export class CompositionDetectorService {
	private cardFrequencyCache: Map<string, number> = new Map();
	private lastCompositionsHash = '';

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
			.map((comp) =>
				this.calculateCompositionMatch(
					comp,
					normalizedPlayerCardIds,
					this.calculateCardFrequencies(availableCompositions),
				),
			)
			.filter((match): match is CompositionMatch => match != null)
			.filter((match) => {
				// Require at least one core card to prevent false positives from utility cards
				// Since we no longer score addon cards, we focus purely on core card presence
				const hasMinimumRequirement = match.coreCardsFound.length >= 1;

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
			.map((comp) =>
				this.calculateCompositionMatch(
					comp,
					normalizedPlayerCardIds,
					this.calculateCardFrequencies(availableCompositions),
				),
			)
			.filter((match): match is CompositionMatch => match != null)
			.filter((match) => {
				// Require at least one core card to prevent false positives from utility cards
				// Since we no longer score addon cards, we focus purely on core card presence
				const hasMinimumRequirement = match.coreCardsFound.length >= 1;

				return match.confidence > 0 && hasMinimumRequirement;
			})
			.filter((match) => match.confidence > 0.3) // Lower threshold for suggestions
			.sort((a, b) => b.confidence - a.confidence)
			.slice(0, maxResults);
	}

	/**
	 * Calculates how frequently each card appears across all compositions
	 * Cards that appear in fewer compositions get higher weights (more informative)
	 */
	private calculateCardFrequencies(compositions: readonly BgsCompAdvice[]): Map<string, number> {
		const compositionsHash = JSON.stringify(compositions.map((c) => c.compId)).slice(0, 100);

		// Use cache if compositions haven't changed
		if (this.lastCompositionsHash === compositionsHash && this.cardFrequencyCache.size > 0) {
			return this.cardFrequencyCache;
		}

		const cardCounts = new Map<string, number>();
		const totalCompositions = compositions.length;

		// Count how many compositions each card appears in
		compositions.forEach((comp) => {
			const seenCards = new Set<string>();
			comp.cards.forEach((card) => {
				if (!seenCards.has(card.cardId)) {
					seenCards.add(card.cardId);
					cardCounts.set(card.cardId, (cardCounts.get(card.cardId) || 0) + 1);
				}
			});
		});

		// Calculate IDF weights: log(totalCompositions / cardFrequency)
		// Cards appearing in fewer compositions get higher weights
		const cardWeights = new Map<string, number>();
		cardCounts.forEach((count, cardId) => {
			// Use natural log for IDF calculation (count is always > 0 since we only process existing cards)
			const idf = Math.log(totalCompositions / count);
			// Normalize to a reasonable range (0.1 to 2.0)
			const normalizedWeight = Math.max(0.1, Math.min(2.0, idf));
			cardWeights.set(cardId, normalizedWeight);
		});

		this.cardFrequencyCache = cardWeights;
		this.lastCompositionsHash = compositionsHash;
		return cardWeights;
	}

	private calculateCompositionMatch(
		composition: BgsCompAdvice,
		playerCardIds: string[],
		cardWeights: Map<string, number>,
	): CompositionMatch | null {
		const coreCards = composition.cards.filter((card) => card.status === 'CORE');
		const addonCards = composition.cards.filter((card) => card.status === 'ADDON');
		const allCompositionCardIds = [...coreCards, ...addonCards].map((card) => card.cardId);

		// Having multiple of the same core card should definitely count, because it means the user
		// is really trying to get that comp
		const coreCardsFound = playerCardIds.filter((cardId) => coreCards.some((c) => c.cardId === cardId));
		const addonCardsFound = playerCardIds.filter((cardId) => addonCards.some((c) => c.cardId === cardId));

		// Calculate foreign cards - cards that don't belong to this composition at all
		const foreignCards = playerCardIds.filter((cardId) => !allCompositionCardIds.includes(cardId));

		const missingCoreCards = coreCards
			.filter((card) => !playerCardIds.includes(card.cardId))
			.map((card) => card.cardId);
		const missingAddonCards = addonCards
			.filter((card) => !playerCardIds.includes(card.cardId))
			.map((card) => card.cardId);

		// Return null if no cards found at all
		if (coreCardsFound.length === 0 && addonCardsFound.length === 0) {
			return null;
		}

		// Calculate weighted scores for found cards
		const coreWeightedScore = coreCardsFound.reduce((sum, cardId) => {
			const weight = cardWeights.get(cardId) || 1.0;
			return sum + weight;
		}, 0);

		// Calculate maximum possible weighted scores for this composition
		const maxCoreWeightedScore = coreCards.reduce((sum, card) => {
			const weight = cardWeights.get(card.cardId) || 1.0;
			return sum + weight;
		}, 0);

		// Calculate core ratio - addon cards don't contribute to confidence, only core cards matter
		const coreRatio = maxCoreWeightedScore > 0 ? coreWeightedScore / maxCoreWeightedScore : 0;

		// Base confidence is purely based on core cards found
		let confidence = coreRatio;

		// Bonus for having at least some core cards
		if (coreCardsFound.length > 0) {
			confidence += 0.1;
		}

		// Foreign cards penalty - cards that don't belong to this composition at all
		// This helps distinguish between genuine composition play vs coincidental card overlap
		let foreignCardsPenalty = 0;
		if (foreignCards.length >= 1) {
			// 1-2 foreign cards: small penalty (transitional/utility cards are normal)
			if (foreignCards.length <= 2) {
				foreignCardsPenalty = 0.05 + (foreignCards.length - 1) * 0.025; // 0.05 - 0.1
			} else {
				// 3+ foreign cards: larger penalty (likely not playing this composition)
				foreignCardsPenalty = 0.15 + (foreignCards.length - 3) * 0.05; // 0.15+
			}
		}
		confidence -= foreignCardsPenalty;

		// Penalty for very large compositions with few core matches
		if (coreCards.length > 5 && coreCardsFound.length < 2) {
			confidence *= 0.5;
		}

		// Bonus for having multiple core cards (shows strong commitment to composition)
		if (coreCardsFound.length >= 3) {
			confidence += 0.1;
		}

		// Cap confidence at 1.0
		confidence = Math.min(confidence, 1.0);

		// Create debugging info for card weights
		const matchCardWeights: { [cardId: string]: number } = {};
		[...coreCardsFound, ...addonCardsFound].forEach((cardId) => {
			matchCardWeights[cardId] = cardWeights.get(cardId) || 1.0;
		});

		return {
			composition,
			confidence,
			coreCardsFound,
			addonCardsFound,
			missingCoreCards,
			missingAddonCards,
			weightedScore: coreWeightedScore,
			cardWeights: matchCardWeights,
			foreignCards,
			foreignCardsPenalty,
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
		const {
			composition,
			confidence,
			coreCardsFound,
			addonCardsFound,
			missingCoreCards,
			missingAddonCards,
			foreignCards,
			foreignCardsPenalty,
		} = match;

		const strengths: string[] = [];
		const weaknesses: string[] = [];
		const nextSteps: string[] = [];

		// Analyze strengths
		if (coreCardsFound.length >= 2) {
			strengths.push(`Strong core with ${coreCardsFound.length} core cards`);
		}
		if (addonCardsFound.length >= 2) {
			strengths.push(`Good support with ${addonCardsFound.length} addon cards available`);
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
		if (foreignCards && foreignCards.length >= 3) {
			weaknesses.push(`${foreignCards.length} cards don't belong to this composition`);
		}

		// Suggest next steps
		if (missingCoreCards.length > 0) {
			nextSteps.push(`Look for missing core cards: ${missingCoreCards.slice(0, 3).join(', ')}`);
		}
		if (coreCardsFound.length < 3) {
			nextSteps.push('Find more core cards to strengthen the composition');
		}
		if (foreignCards && foreignCards.length >= 3) {
			nextSteps.push(`Consider replacing off-composition cards with relevant core/addon cards`);
		}

		const summary = `Confidence: ${Math.round(confidence * 100)}% - ${coreCardsFound.length} core, ${
			addonCardsFound.length
		} addon cards${foreignCards && foreignCards.length > 0 ? `, ${foreignCards.length} foreign cards` : ''}`;

		return {
			summary,
			strengths,
			weaknesses,
			nextSteps,
		};
	}

	/**
	 * Analyzes card frequency across all compositions for debugging
	 * @param compositions - List of compositions to analyze
	 * @returns Analysis showing how often each card appears and its weight
	 */
	getCardFrequencyAnalysis(compositions: readonly BgsCompAdvice[]): {
		cardId: string;
		frequency: number;
		weight: number;
		compositionNames: string[];
	}[] {
		const cardWeights = this.calculateCardFrequencies(compositions);
		const cardFrequencies = new Map<string, { count: number; compositionNames: string[] }>();

		// Count occurrences and track composition names
		compositions.forEach((comp) => {
			const seenCards = new Set<string>();
			comp.cards.forEach((card) => {
				if (!seenCards.has(card.cardId)) {
					seenCards.add(card.cardId);
					const current = cardFrequencies.get(card.cardId) || { count: 0, compositionNames: [] };
					current.count += 1;
					current.compositionNames.push(comp.name || comp.compId);
					cardFrequencies.set(card.cardId, current);
				}
			});
		});

		// Convert to analysis format
		const analysis: {
			cardId: string;
			frequency: number;
			weight: number;
			compositionNames: string[];
		}[] = [];

		cardFrequencies.forEach((data, cardId) => {
			analysis.push({
				cardId,
				frequency: data.count,
				weight: cardWeights.get(cardId) || 1.0,
				compositionNames: data.compositionNames,
			});
		});

		// Sort by frequency (most common first)
		return analysis.sort((a, b) => b.frequency - a.frequency);
	}
}

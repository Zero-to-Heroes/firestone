import { Injectable } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export interface CompositionMatch {
	composition: BgsCompAdvice;
	baseConfidence: number;
	confidence: number;
	coreCardsFound: string[];
	addonCardsFound: string[];
	missingCoreCards: string[];
	missingAddonCards: string[];
	// Add debugging info for the new weighting system
	weightedScore?: number;
	addonWeightedScore?: number;
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
				// Weight-based minimum requirements
				// Require either decent confidence (25%+) OR at least one important card (weight >= 20)
				const hasMinimumRequirement = match.confidence >= 0.25 || match.coreCardsFound.length >= 1; // coreCardsFound now represents weight >= 20 cards
				return match.confidence > 0 && hasMinimumRequirement;
			})
			.sort((a, b) => b.confidence - a.confidence);

		// Return the best match if it has sufficient confidence
		const bestMatch = matches[0];
		if (bestMatch && bestMatch.confidence >= 0.25) {
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
		ignoreConfidenceThreshold: boolean = false,
	): CompositionMatch[] {
		if (!playerCards.board.length && !playerCards.hand.length) {
			return [];
		}

		const allPlayerCardIds = [...playerCards.board, ...playerCards.hand];
		const normalizedPlayerCardIds = this.normalizeCardIds(allPlayerCardIds);

		// TODO: if there is not a clear winner (eg two comps are rather similar, and the board we have from the user doesn't let
		// us really know which of these it is), we shouldn't assign anything
		const sortedComps = availableCompositions
			.map((comp) =>
				this.calculateCompositionMatch(
					comp,
					normalizedPlayerCardIds,
					this.calculateCardFrequencies(availableCompositions),
				),
			)
			.filter((match): match is CompositionMatch => match != null)
			.sort((a, b) => b.confidence - a.confidence);
		if (ignoreConfidenceThreshold) {
			return sortedComps;
		}
		return sortedComps.filter((match) => match.confidence >= 0.25).slice(0, maxResults);
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
		const allCompositionCardIds = composition.cards.map((card) => card.cardId);
		const allCardsFound = playerCardIds.filter((cardId) =>
			allCompositionCardIds.some((compCardId) => isCardOrSubstitute(compCardId, cardId)),
		);

		// Calculate foreign cards - cards that don't belong to this composition at all
		const foreignCards = playerCardIds.filter(
			(cardId) => !allCompositionCardIds.some((compCardId) => isCardOrSubstitute(compCardId, cardId)),
		);

		// Return null if no cards found at all
		if (allCardsFound.length === 0) {
			return null;
		}

		// Calculate total weight of the composition
		const totalCompositionWeight = composition.cards.reduce((sum, card) => {
			return sum + (card.finalBoardWeight || 1);
		}, 0);

		// Calculate weight of found cards
		const foundCardsWeight = allCardsFound.reduce((sum, cardId) => {
			const card = composition.cards.find((c) => isCardOrSubstitute(c.cardId, cardId));
			return sum + (card?.finalBoardWeight || 1);
		}, 0);

		// Check for critical cards (weight >= 80) - these are essentially mandatory
		const criticalCards = composition.cards.filter((card) => (card.finalBoardWeight || 1) >= 80);
		const criticalCardsFound = allCardsFound.filter((cardId) => criticalCards.some((c) => c.cardId === cardId));

		// If composition has critical cards and none are found, apply major penalty or disqualify
		if (criticalCards.length > 0 && criticalCardsFound.length === 0) {
			// Don't completely disqualify, but apply severe penalty
			// This allows for edge cases where critical cards might be temporarily off-board
			return null;
		}

		// Base confidence: ratio of found weight to total weight
		let confidence = foundCardsWeight / totalCompositionWeight;
		const baseConfidence = confidence;
		// console.debug(
		// 	'[bgComp] baseConfidence',
		// 	baseConfidence,
		// 	totalCompositionWeight,
		// 	foundCardsWeight,
		// 	composition.cards,
		// 	allCardsFound,
		// );

		// High-importance card bonus
		const importantCards = composition.cards.filter((card) => (card.finalBoardWeight || 1) >= 20);
		const importantCardsFound = allCardsFound.filter((cardId) =>
			importantCards.some((c) => isCardOrSubstitute(c.cardId, cardId)),
		);

		if (importantCardsFound.length > 0) {
			confidence += 0.1; // Bonus for having important cards
		}

		// Multiple important cards bonus
		if (importantCardsFound.length >= 2) {
			confidence += 0.05; // Additional bonus for multiple important cards
		}

		// Bonus for having many cards from composition (shows commitment)
		if (allCardsFound.length >= 4) {
			confidence += 0.1;
		}

		// Foreign cards penalty - scaled by weight vs composition weight
		// Heavy penalty if foreign cards dominate the board
		let foreignCardsPenalty = 0;
		if (foreignCards.length > 0) {
			const foreignCardRatio = foreignCards.length / (foreignCards.length + allCardsFound.length);
			if (foreignCardRatio > 0.5) {
				// More than half the cards are foreign - major penalty
				foreignCardsPenalty = 0.3 * foreignCardRatio;
			} else if (foreignCardRatio > 0.3) {
				// 30-50% foreign cards - moderate penalty
				foreignCardsPenalty = 0.15 * foreignCardRatio;
			} else {
				// <30% foreign cards - small penalty (normal utility cards)
				foreignCardsPenalty = 0.05 * foreignCardRatio;
			}
		}
		confidence -= foreignCardsPenalty;

		// Penalty for very large compositions with few matches
		if (composition.cards.length > 8 && allCardsFound.length < 3) {
			confidence *= 0.5;
		}

		// Cap confidence at 1.0
		confidence = Math.min(confidence, 1.0);

		// Create debugging info combining IDF weights with final board weights
		const matchCardWeights: { [cardId: string]: number } = {};
		allCardsFound.forEach((cardId) => {
			const card = composition.cards.find((c) => isCardOrSubstitute(c.cardId, cardId));
			const finalBoardWeight = card?.finalBoardWeight || 1;
			const idfWeight = cardWeights.get(cardId) || 1.0;
			matchCardWeights[cardId] = finalBoardWeight * idfWeight;
		});

		// Legacy compatibility - separate cards into core/addon based on weight
		const coreCardsFound = allCardsFound.filter((cardId) => {
			const card = composition.cards.find((c) => isCardOrSubstitute(c.cardId, cardId));
			return (card?.finalBoardWeight || 1) >= 20; // Consider weight >= 20 as "core"
		});
		const addonCardsFound = allCardsFound.filter((cardId) => {
			const card = composition.cards.find((c) => isCardOrSubstitute(c.cardId, cardId));
			return (card?.finalBoardWeight || 1) < 20; // Consider weight < 20 as "addon"
		});

		const missingCoreCards = composition.cards
			.filter(
				(card) =>
					(card.finalBoardWeight || 1) >= 20 &&
					!playerCardIds.some((c) => isCardOrSubstitute(c, card.cardId)),
			)
			.map((card) => card.cardId);
		const missingAddonCards = composition.cards
			.filter(
				(card) =>
					(card.finalBoardWeight || 1) < 20 && !playerCardIds.some((c) => isCardOrSubstitute(c, card.cardId)),
			)
			.map((card) => card.cardId);

		return {
			composition,
			baseConfidence,
			confidence,
			coreCardsFound,
			addonCardsFound,
			missingCoreCards,
			missingAddonCards,
			weightedScore: foundCardsWeight,
			addonWeightedScore: foundCardsWeight, // Combined now
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
			strengths.push(`Strong foundation with ${coreCardsFound.length} important cards (weight ≥20)`);
		}
		if (addonCardsFound.length >= 2) {
			strengths.push(`Good support with ${addonCardsFound.length} supporting cards`);
		}
		if (confidence >= 0.7) {
			strengths.push('High confidence match');
		}

		// Analyze weaknesses
		if (missingCoreCards.length > 0) {
			weaknesses.push(`Missing ${missingCoreCards.length} important cards (weight ≥20)`);
		}
		if (coreCardsFound.length === 0) {
			weaknesses.push('No important cards found');
		}
		if (confidence < 0.5) {
			weaknesses.push('Low confidence match');
		}
		if (foreignCards && foreignCards.length >= 3) {
			weaknesses.push(`${foreignCards.length} cards don't belong to this composition`);
		}

		// Suggest next steps
		if (missingCoreCards.length > 0) {
			nextSteps.push(`Look for missing important cards: ${missingCoreCards.slice(0, 3).join(', ')}`);
		}
		if (coreCardsFound.length < 3) {
			nextSteps.push('Find more important cards to strengthen the composition');
		}
		if (foreignCards && foreignCards.length >= 3) {
			nextSteps.push(`Consider replacing off-composition cards with relevant composition cards`);
		}

		const summary = `Confidence: ${Math.round(confidence * 100)}% - ${coreCardsFound.length} important, ${
			addonCardsFound.length
		} supporting cards${foreignCards && foreignCards.length > 0 ? `, ${foreignCards.length} foreign cards` : ''}`;

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

export const isCardOrSubstitute = (compCardId: string, playerCardId: string) => {
	if (compCardId === playerCardId) {
		return true;
	}
	if (compCardId === CardIds.BrannBronzebeard_BG_LOE_077 || compCardId === CardIds.BrannBronzebeard_TB_BaconUps_045) {
		return (
			playerCardId === CardIds.MoiraBronzebeard_BG27_518 || playerCardId === CardIds.MoiraBronzebeard_BG27_518_G
		);
	}
	if (compCardId === CardIds.TitusRivendare_BG25_354 || compCardId === CardIds.TitusRivendare_BG25_354_G) {
		return (
			playerCardId === CardIds.MoiraBronzebeard_BG27_518 || playerCardId === CardIds.MoiraBronzebeard_BG27_518_G
		);
	}
	return false;
};

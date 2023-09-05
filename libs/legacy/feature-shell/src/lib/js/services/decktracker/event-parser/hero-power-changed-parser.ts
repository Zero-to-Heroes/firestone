import { sanitizeDeckstring } from '@components/decktracker/copy-deckstring.component';
import { decode, encode } from '@firestone-hs/deckstrings';
import { GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DuelsDecksProviderService } from '../../duels/duels-decks-provider.service';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { EventParser } from './event-parser';

export class HeroPowerChangedParser implements EventParser {
	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly duelsRunService: DuelsDecksProviderService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = this.allCards.getCard(cardId);
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: this.i18n.getCardName(cardId, dbCard.name),
			manaCost: dbCard.cost,
			rarity: dbCard.rarity,
			zone: 'PLAY',
			temporaryCard: false,
			playTiming: GameState.playTiming++,
		} as DeckCard);

		// Used for Twitch
		console.debug('[duels-run-deckstring] will handle duels deck?', currentState);
		const duelsStartingDeckstring = !isPlayer
			? null
			: currentState.metadata.gameType === GameType.GT_PVPDR ||
			  currentState.metadata.gameType === GameType.GT_PVPDR_PAID
			? this.getDuelsStartingDeckstring(
					currentState.playerDeck.deckstring,
					currentState.playerDeck.hero?.cardId,
					card?.cardId,
			  )
			: null;

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			heroPower: card,
			duelsStartingDeckstring: duelsStartingDeckstring,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.HERO_POWER_CHANGED;
	}

	private getDuelsStartingDeckstring(currentDeckString: string, heroCardId: string, heroPowerCardId: string): string {
		const currentDeck = decode(currentDeckString);
		if (!currentDeck?.cards?.length) {
			console.debug('[duels-run-deckstring] no deck found', currentDeck);
			return null;
		}

		// Take care of the treasure being here
		if (currentDeck.cards.length <= 16) {
			const result = encode(sanitizeDeckstring(currentDeck, this.allCards));
			console.debug('[duels-run-deckstring] first game, returning deckstring', result, currentDeck);
			return result;
		}

		const allRuns = this.duelsRunService.duelsRuns$.getValue();
		const currentRun = allRuns[0];
		console.debug('[duels-run-deckstring] current run', currentRun);
		if (currentRun?.heroCardId !== heroCardId || currentRun?.heroPowerCardId !== heroPowerCardId) {
			console.debug(
				'[duels-run-deckstring] hero or hero power do not match',
				currentRun,
				heroCardId,
				heroPowerCardId,
			);
			return null;
		}
		const deckDefinition = decode(currentRun.initialDeckList);
		const updatedDeckDefinition = sanitizeDeckstring(deckDefinition, this.allCards);
		const result = encode(updatedDeckDefinition);
		console.debug('[duels-run-deckstring] returning deckstring', result, updatedDeckDefinition, deckDefinition);
		return result;
	}
}

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnSpellPlaySecretsParser implements EventParser {
	private secretsTriggeringOnAttack = [
		CardIds.Collectible.Hunter.CatTrick,
		CardIds.Collectible.Hunter.PressurePlate,
		CardIds.Collectible.Mage.Counterspell,
		CardIds.Collectible.Mage.Spellbender,
		CardIds.Collectible.Mage.ManaBind,
	];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_PLAYED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isSpellPlayedByPlayer = controllerId === localPlayer.PlayerId;
		const spellCard = this.allCards.getCard(cardId);
		if (!spellCard || !spellCard.type || spellCard.type.toLowerCase() !== CardType[CardType.SPELL].toLowerCase()) {
			return currentState;
		}
		const deckWithSecretToCheck = isSpellPlayedByPlayer ? currentState.opponentDeck : currentState.playerDeck;

		const secretsWeCantRuleOut = [];

		const targetCardId = gameEvent.additionalData.targetEntityId;
		if (!targetCardId) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.Spellbender);
		} else {
			const targetCard = this.allCards.getCard(targetCardId);
			if (
				!targetCard ||
				!targetCard.type ||
				targetCard.type.toLowerCase() !== CardType[CardType.MINION].toLowerCase()
			) {
				secretsWeCantRuleOut.push(CardIds.Collectible.Mage.Spellbender);
			}
		}

		// Might need to be a little more specific than this? E.g. with dormant minions?
		// It's an edge case, so leaving it aside for a first implementation
		const deckWithBoard = isSpellPlayedByPlayer ? currentState.playerDeck : currentState.opponentDeck;
		if (deckWithBoard.board.length === 0) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.PressurePlate);
		}

		const isBoardFull = deckWithSecretToCheck.board.length === 7;
		if (isBoardFull) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.CatTrick);
		}

		// TODO: handle the case where the max hand size has been bumped to 12
		const isHandFull = deckWithSecretToCheck.hand.length >= 10;
		if (isHandFull) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.ManaBind);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnAttack.filter(
			secret => secretsWeCantRuleOut.indexOf(secret) === -1,
		);
		let secrets: BoardSecret[] = [...deckWithSecretToCheck.secrets];
		for (const secret of optionsToFlagAsInvalid) {
			console.log('marking as invalid', secret, secrets);
			secrets = [...this.helper.removeSecretOptionFromSecrets(secrets, secret)];
			// console.log('marked as invalid', secret, newPlayerDeck);
		}
		let newPlayerDeck = deckWithSecretToCheck.update({
			secrets: secrets as readonly BoardSecret[],
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isSpellPlayedByPlayer ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_SPELL_PLAYED';
	}
}

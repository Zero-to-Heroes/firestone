import { CardIds, CardType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { COUNTERSPELLS } from '../../../hs-utils';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnSpellPlaySecretsParser implements EventParser {
	private secretsTriggeringOnSpellPlayed = [
		CardIds.CatTrick,
		CardIds.IceTrap,
		CardIds.BeaststalkerTavish_ImprovedIceTrapToken,
		CardIds.PressurePlate,
		CardIds.CounterspellLegacy,
		CardIds.CounterspellCore,
		CardIds.CounterspellVanilla,
		CardIds.NetherwindPortal,
		CardIds.SpellbenderLegacy,
		CardIds.SpellbenderVanilla,
		CardIds.ManaBind,
		CardIds.NeverSurrender,
		CardIds.OhMyYogg,
		CardIds.DirtyTricks,
		CardIds.StickySituation,
	];

	private secretWillTrigger: {
		cardId: string;
		reactingToCardId: string;
		reactingToEntityId: number;
	};

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			state &&
			gameEvent.gameState &&
			(gameEvent.type === GameEvent.CARD_PLAYED ||
				gameEvent.type === GameEvent.SECRET_PLAYED ||
				gameEvent.type === GameEvent.QUEST_PLAYED)
		);
	}

	async parse(
		currentState: GameState,
		gameEvent: GameEvent,
		additionalInfo?: {
			secretWillTrigger: {
				cardId: string;
				reactingToCardId: string;
				reactingToEntityId: number;
			};
			minionsWillDie: readonly {
				cardId: string;
				entityId: number;
			}[];
		},
	): Promise<GameState> {
		const [cardId, controllerId, localPlayer] = gameEvent.parse();
		if (!cardId) {
			console.warn('[trigger-on-spell-play] no card Id', gameEvent.parse());
			return currentState;
		}

		this.secretWillTrigger = additionalInfo?.secretWillTrigger;

		const isSpellPlayedByPlayer = controllerId === localPlayer.PlayerId;
		const spellCard = this.allCards.getCard(cardId);
		if (!spellCard || !spellCard.type || spellCard.type.toLowerCase() !== CardType[CardType.SPELL].toLowerCase()) {
			return currentState;
		}

		// If a counterspell has been triggered, the other secrets won't trigger
		if (
			COUNTERSPELLS.includes(this.secretWillTrigger?.cardId as CardIds) &&
			gameEvent.cardId === this.secretWillTrigger?.reactingToCardId
		) {
			console.log('[trigger-on-spell-play] counterspell triggered, no secrets will trigger');
			return currentState;
		}

		const deckWithSecretToCheck = isSpellPlayedByPlayer ? currentState.opponentDeck : currentState.playerDeck;

		const secretsWeCantRuleOut = [];

		const targetCardId = gameEvent.additionalData.targetCardId;
		if (!targetCardId) {
			secretsWeCantRuleOut.push(CardIds.SpellbenderLegacy);
			secretsWeCantRuleOut.push(CardIds.SpellbenderVanilla);
		} else {
			const targetCard = this.allCards.getCard(targetCardId);
			if (
				!targetCard ||
				!targetCard.type ||
				targetCard.type.toLowerCase() !== CardType[CardType.MINION].toLowerCase()
			) {
				secretsWeCantRuleOut.push(CardIds.SpellbenderVanilla);
			}
		}

		// Might need to be a little more specific than this? E.g. with dormant minions?
		// It's an edge case, so leaving it aside for a first implementation
		const deckWithBoard = isSpellPlayedByPlayer ? currentState.playerDeck : currentState.opponentDeck;
		if (deckWithBoard.board.length === 0) {
			secretsWeCantRuleOut.push(CardIds.PressurePlate);
		}

		const isBoardFull = deckWithSecretToCheck.board.length === 7;
		if (isBoardFull) {
			secretsWeCantRuleOut.push(CardIds.CatTrick);
			secretsWeCantRuleOut.push(CardIds.NetherwindPortal);
			secretsWeCantRuleOut.push(CardIds.StickySituation);
		}

		const isBoardEmpty = deckWithSecretToCheck.board.length === 0;
		if (isBoardEmpty) {
			secretsWeCantRuleOut.push(CardIds.NeverSurrender);
		}

		// TODO: handle the case where the max hand size has been bumped to 12
		const isHandFull = deckWithSecretToCheck.hand.length >= 10;
		if (isHandFull) {
			secretsWeCantRuleOut.push(CardIds.ManaBind);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnSpellPlayed.filter(
			(secret) => secretsWeCantRuleOut.indexOf(secret) === -1,
		);
		let secrets: BoardSecret[] = [...deckWithSecretToCheck.secrets];
		for (const secret of optionsToFlagAsInvalid) {
			secrets = [...this.helper.removeSecretOptionFromSecrets(secrets, secret)];
		}
		const newPlayerDeck = deckWithSecretToCheck.update({
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

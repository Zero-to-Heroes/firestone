import { CardIds, CardType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { COUNTERSPELLS } from '../../../hs-utils';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnMinionPlaySecretsParser implements EventParser {
	private secretsTriggeringOnMinionPlay = [
		CardIds.HiddenCache,
		CardIds.Kidnap_REV_828,
		CardIds.SnipeLegacy_EX1_609,
		CardIds.SnipeVanilla,
		CardIds.PotionOfPolymorph,
		CardIds.MirrorEntityLegacy,
		CardIds.MirrorEntity,
		CardIds.MirrorEntityVanilla,
		CardIds.FrozenClone_CORE_ICC_082,
		CardIds.FrozenClone_ICC_082,
		CardIds.ExplosiveRunes,
		CardIds.ExplosiveRunesCore,
		CardIds.RepentanceLegacy,
		CardIds.RepentanceVanilla,
		CardIds.SacredTrial,
		CardIds.AmbushCore,
		CardIds.Ambush,
		CardIds.Objection,
		CardIds.Zombeeees,
		CardIds.Zombeeees_ImprovedZombeeeesToken,
	];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.gameState && gameEvent.type === GameEvent.CARD_PLAYED;
	}

	async parse(
		currentState: GameState,
		gameEvent: GameEvent,
		additionalInfo?: {
			secretWillTrigger?: {
				cardId: string;
				reactingToCardId: string;
				reactingToEntityId: number;
			};
			minionsWillDie?: readonly {
				cardId: string;
				entityId: number;
			}[];
		},
	): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isMinionPlayedByPlayer = controllerId === localPlayer.PlayerId;
		const dbCard = this.allCards.getCard(cardId);
		if (!dbCard || !dbCard.type || dbCard.type.toLowerCase() !== CardType[CardType.MINION].toLowerCase()) {
			return currentState;
		}
		const deckWithSecretToCheck = isMinionPlayedByPlayer ? currentState.opponentDeck : currentState.playerDeck;

		const isCardCountered =
			((additionalInfo?.secretWillTrigger?.reactingToEntityId &&
				additionalInfo?.secretWillTrigger?.reactingToEntityId === entityId) ||
				(additionalInfo?.secretWillTrigger?.reactingToCardId &&
					additionalInfo?.secretWillTrigger?.reactingToCardId === cardId)) &&
			COUNTERSPELLS.includes(additionalInfo?.secretWillTrigger?.cardId as CardIds);
		if (isCardCountered) {
			console.log('[trigger-on-spell-play] counterspell triggered, no secrets will trigger');
			return currentState;
		}

		const secretsWeCantRuleOut = [];
		// The only case where we can for sure know that the secret could be HiddenCache without
		// triggering is when there are no cards in hand. Otherwise, we're just guessing
		// We take the stance here that the most likely scenario is that the opponent has a
		// minion in hand (which is even more likely if they actually played HiddenCache)
		if (deckWithSecretToCheck.hand.length === 0) {
			secretsWeCantRuleOut.push(CardIds.HiddenCache);
		}

		if (gameEvent.additionalData.immune) {
			// Trigger, but the minion takes no damage
			// secretsWeCantRuleOut.push(CardIds.ExplosiveRunes);
			// secretsWeCantRuleOut.push(CardIds.ExplosiveRunesCore);
			// Is Kidnap a bug?
			secretsWeCantRuleOut.push(CardIds.Kidnap_REV_828);
			// secretsWeCantRuleOut.push(CardIds.PotionOfPolymorph);
			// secretsWeCantRuleOut.push(CardIds.SnipeLegacy);
			// secretsWeCantRuleOut.push(CardIds.SnipeVanilla);
		}

		const isBoardFull = deckWithSecretToCheck.board.length === 7;
		if (isBoardFull) {
			secretsWeCantRuleOut.push(CardIds.MirrorEntityLegacy);
			secretsWeCantRuleOut.push(CardIds.MirrorEntity);
			secretsWeCantRuleOut.push(CardIds.MirrorEntityVanilla);
			secretsWeCantRuleOut.push(CardIds.AmbushCore);
			secretsWeCantRuleOut.push(CardIds.Ambush);
			secretsWeCantRuleOut.push(CardIds.Kidnap_REV_828);
			secretsWeCantRuleOut.push(CardIds.Zombeeees);
			secretsWeCantRuleOut.push(CardIds.Zombeeees_ImprovedZombeeeesToken);
		}

		const enemyBoard = (isMinionPlayedByPlayer ? currentState.playerDeck : currentState.opponentDeck).board;
		if (enemyBoard.length < 3) {
			secretsWeCantRuleOut.push(CardIds.SacredTrial);
		}
		// TODO: handle the case where the max hand size has been bumped to 12
		const isHandFull = deckWithSecretToCheck.hand.length >= 10;
		if (isHandFull) {
			secretsWeCantRuleOut.push(CardIds.Duplicate);
		}

		const isDormant = gameEvent.additionalData.dormant;
		if (isDormant) {
			secretsWeCantRuleOut.push(CardIds.ExplosiveRunes);
			secretsWeCantRuleOut.push(CardIds.ExplosiveRunesCore);
			secretsWeCantRuleOut.push(CardIds.SnipeLegacy_EX1_609);
			secretsWeCantRuleOut.push(CardIds.SnipeVanilla);
			secretsWeCantRuleOut.push(CardIds.PotionOfPolymorph);
			secretsWeCantRuleOut.push(CardIds.RepentanceLegacy);
			secretsWeCantRuleOut.push(CardIds.RepentanceVanilla);
			secretsWeCantRuleOut.push(CardIds.SacredTrial);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnMinionPlay.filter(
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
			[isMinionPlayedByPlayer ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_MINION_PLAYED';
	}
}

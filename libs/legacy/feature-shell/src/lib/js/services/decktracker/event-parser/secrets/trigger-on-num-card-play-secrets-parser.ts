import { CardIds } from '@firestone-hs/reference-data';
import { BoardSecret, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnNumCardPlaySecretsParser implements EventParser {
	private secretsTriggeringOnAttack = [
		CardIds.RatTrap,
		CardIds.RatTrap_CORE_GIL_577,
		CardIds.HiddenWisdom,
		CardIds.GallopingSavior,
		CardIds.MotionDenied,
		CardIds.MotionDenied_ImprovedMotionDeniedToken,
	];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.NUM_CARDS_PLAYED_THIS_TURN;
	}

	async parse(
		currentState: GameState,
		gameEvent: GameEvent,
		additionalInfo: {
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
		const [, cardPlayedControllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayerWhoPlayedCard = cardPlayedControllerId === localPlayer.PlayerId;
		const deckFromPlayedCard = isPlayerWhoPlayedCard ? currentState.playerDeck : currentState.opponentDeck;
		const deckWithSecretToCheck = isPlayerWhoPlayedCard ? currentState.opponentDeck : currentState.playerDeck;

		const toExclude = [];
		const cardsCounteredThisTurn = deckFromPlayedCard.cardsCounteredThisTurn ?? 0;
		const isCurrentCardCountered = additionalInfo?.secretWillTrigger?.reactingToEntityId === entityId ? 1 : 0;
		const actualCardsPlayedThisTurn =
			gameEvent.additionalData.cardsPlayed - cardsCounteredThisTurn - isCurrentCardCountered;
		console.debug(
			'[debug] card played this turn',
			actualCardsPlayedThisTurn,
			gameEvent.additionalData.cardsPlayed,
			cardsCounteredThisTurn,
			isCurrentCardCountered,
			currentState.playerDeck.cardsPlayedThisTurn,
		);
		if (actualCardsPlayedThisTurn < 3) {
			toExclude.push(CardIds.RatTrap);
			toExclude.push(CardIds.RatTrap_CORE_GIL_577);
			toExclude.push(CardIds.HiddenWisdom);
			toExclude.push(CardIds.GallopingSavior);
			toExclude.push(CardIds.MotionDenied);
			toExclude.push(CardIds.MotionDenied_ImprovedMotionDeniedToken);
		}
		if (deckWithSecretToCheck.board.length === 7) {
			toExclude.push(CardIds.RatTrap);
			toExclude.push(CardIds.RatTrap_CORE_GIL_577);
			toExclude.push(CardIds.GallopingSavior);
		}
		if (deckWithSecretToCheck.hand.length === 10) {
			toExclude.push(CardIds.HiddenWisdom);
		}
		const optionsToFlagAsInvalid = this.secretsTriggeringOnAttack.filter(
			(secret) => toExclude.indexOf(secret) === -1,
		);
		let secrets: BoardSecret[] = [...deckWithSecretToCheck.secrets];
		for (const secret of optionsToFlagAsInvalid) {
			secrets = [...this.helper.removeSecretOptionFromSecrets(secrets, secret)];
		}
		const newPlayerDeck = deckWithSecretToCheck.update({
			secrets: secrets as readonly BoardSecret[],
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayerWhoPlayedCard ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_NUM_CARDS_PLAYED';
	}
}

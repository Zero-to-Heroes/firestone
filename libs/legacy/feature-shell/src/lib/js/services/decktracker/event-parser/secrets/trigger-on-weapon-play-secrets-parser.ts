import { CardIds, CardType } from '@firestone-hs/reference-data';
import { BoardSecret, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../models/game-event';
import { COUNTERSPELLS } from '../../../hs-utils';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnWeaponPlaySecretsParser implements EventParser {
	private secretsTriggeringOnWeaponPlayed = [CardIds.BargainBin_MIS_105];

	private secretWillTrigger: {
		cardId: string;
		reactingToCardId: string;
		reactingToEntityId: number;
	};

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && (gameEvent.type === GameEvent.CARD_PLAYED || gameEvent.type === GameEvent.WEAPON_EQUIPPED);
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

		const isWeaponPlayedByPlayer = controllerId === localPlayer.PlayerId;
		const weaponCard = this.allCards.getCard(cardId);
		if (
			!weaponCard ||
			!weaponCard.type ||
			weaponCard.type.toLowerCase() !== CardType[CardType.WEAPON].toLowerCase()
		) {
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

		const deckWithSecretToCheck = isWeaponPlayedByPlayer ? currentState.opponentDeck : currentState.playerDeck;

		const secretsWeCantRuleOut = [];

		// TODO: handle the case where the max hand size has been bumped to 12
		const isHandFull = deckWithSecretToCheck.hand.length >= 10;
		if (isHandFull) {
			secretsWeCantRuleOut.push(CardIds.BargainBin_MIS_105);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnWeaponPlayed.filter(
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
			[isWeaponPlayedByPlayer ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_WEAPON_PLAYED';
	}
}

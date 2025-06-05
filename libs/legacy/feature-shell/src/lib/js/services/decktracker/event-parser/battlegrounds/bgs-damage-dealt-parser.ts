import { CardType, isBattlegrounds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DamageGameEvent } from '@legacy-import/src/lib/js/models/mainwindow/game-events/damage-game-event';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from '../event-parser';

export class BgsDamageDealtParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			!!state &&
			isBattlegrounds(state.metadata?.gameType) &&
			gameEvent.additionalData.targets &&
			Object.keys(gameEvent.additionalData.targets).length === 1
		);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const targetValues = Object.values((gameEvent as DamageGameEvent).additionalData.targets);
		const playerCardId = targetValues[0].TargetCardId;
		if (this.allCards.getCard(playerCardId)?.type?.toUpperCase() !== CardType[CardType.HERO]) {
			return currentState;
		}

		const damage = targetValues.find((target) => target.TargetCardId === playerCardId)?.Damage;
		const playerId = targetValues[0].TargetControllerId;

		const playerToUpdate = currentState.bgState.currentGame.findPlayer(playerId);
		if (!playerToUpdate) {
			console.warn(
				'[bgs-damage] Could not find player to update for damage dealt',
				playerId,
				gameEvent,
				this.allCards.getCard(playerCardId),
				currentState.bgState.currentGame.players.map((p) => ({
					id: p.playerId,
					cardId: p.cardId,
					name: p.name,
				})),
			);
			return currentState;
		}
		const newPlayer = playerToUpdate.update({
			damageTaken: damage,
		});
		const newGame = currentState.bgState.currentGame.updatePlayer(newPlayer);

		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.DAMAGE;
	}
}

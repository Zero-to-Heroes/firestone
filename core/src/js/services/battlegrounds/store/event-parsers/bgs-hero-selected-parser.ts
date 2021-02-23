import { AllCardsService } from '@firestone-hs/replay-parser';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsTavernUpgrade } from '../../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { getHeroPower, normalizeHeroCardId } from '../../bgs-utils';
import { BgsHeroSelectedEvent } from '../events/bgs-hero-selected-event';
import { BgsNextOpponentEvent } from '../events/bgs-next-opponent-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsNextOpponentParser } from './bgs-next-opponent-parser';
import { EventParser } from './_event-parser';

export class BgsHeroSelectedParser implements EventParser {
	constructor(private readonly allCards: AllCardsService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsHeroSelectedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsHeroSelectedEvent): Promise<BattlegroundsState> {
		const normalizedCardId = normalizeHeroCardId(event.cardId);
		const newPlayer: BgsPlayer = BgsPlayer.create({
			cardId: normalizedCardId,
			heroPowerCardId: getHeroPower(event.cardId),
			name: this.allCards.getCard(event.cardId).name,
			isMainPlayer: true,
			initialHealth: event.additionalData?.health,
			damageTaken: event?.additionalData?.damage ?? 0,
			leaderboardPlace: event.additionalData?.leaderboardPlace,
			tavernUpgradeHistory: event.additionalData?.tavernLevel
				? ([{ turn: undefined, tavernTier: event.additionalData?.tavernLevel }] as readonly BgsTavernUpgrade[])
				: [],
		} as BgsPlayer);
		const newGame = currentState.currentGame.update({
			players: [...currentState.currentGame.players, newPlayer] as readonly BgsPlayer[],
		} as BgsGame);
		const updatedState = currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
		if (event.additionalData?.nextOpponentCardId) {
			return new BgsNextOpponentParser().parse(
				updatedState,
				new BgsNextOpponentEvent(event.additionalData.nextOpponentCardId),
			);
		} else {
			return updatedState;
		}
	}
}

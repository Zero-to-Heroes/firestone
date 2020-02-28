import { AllCardsService } from '@firestone-hs/replay-parser';
import { BattlegroundsHero } from '../../../models/battlegrounds/battlegrounds-hero';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { BattlegroundsHeroInfoService } from '../battlegrounds-hero-info.service';
import { EventParser } from './event-parser';

export class BattlegroundsShowHeroSelectionParser implements EventParser {
	constructor(
		private readonly infoService: BattlegroundsHeroInfoService,
		private readonly allCards: AllCardsService,
	) {}

	public applies(gameEvent: GameEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === GameEvent.BATTLEGROUNDS_HERO_SELECTION;
	}

	public async parse(
		currentState: BattlegroundsState,
		event: GameEvent,
		appState: MainWindowState,
	): Promise<BattlegroundsState> {
		const cardIds = event.additionalData.heroCardIds;
		// Fetch hero information from remote
		const heroInfos: readonly BattlegroundsHero[] = await this.infoService.retrieveHeroInfo(cardIds);
		const heroes = cardIds.map(cardId => this.buildHeroInfo(cardId, heroInfos, appState));
		return currentState.update({
			heroSelection: heroes,
		} as BattlegroundsState);
	}

	public event() {
		return GameEvent.BATTLEGROUNDS_HERO_SELECTION;
	}

	private buildHeroInfo(
		cardId: string,
		heroInfos: readonly BattlegroundsHero[],
		appState: MainWindowState,
	): BattlegroundsHero {
		if (!appState || !appState.stats || !appState.stats.gameStats) {
			return null;
		}
		const heroInfo = heroInfos.find(info => info.cardId === cardId);
		// Build stats
		const heroStats = appState.stats.gameStats.stats
			.filter(stat => stat.gameMode === 'battlegrounds')
			.filter(stat => stat.playerCardId === cardId);
		const numberOfGamesPlayed = heroStats.length;
		const averageRank =
			heroStats
				.map(stat => stat.additionalResult)
				.filter(rank => rank)
				.map(rank => parseInt(rank))
				.reduce((a, b) => a + b, 0) / numberOfGamesPlayed;
		const heroName = this.allCards.getCard(cardId).name;
		// Update selected hero
		const hero = BattlegroundsHero.create({
			heroName: heroName,
			cardId: cardId,
			numberOfGamesPlayed: numberOfGamesPlayed,
			averageRank: averageRank,
			difficulty: heroInfo ? heroInfo.difficulty : 'unknown',
			powerLevel: heroInfo ? heroInfo.powerLevel : 'unknown',
			strategy: heroInfo ? heroInfo.strategy : null,
		} as BattlegroundsHero);
		// console.log('updating displayed hero', hero);
		return hero;
	}
}

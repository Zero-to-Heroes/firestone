import { CardIds, duelsHeroConfigs, normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { DuelsHeroFilterType } from '@models/duels/duels-hero-filter.type';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsTopDecksHeroFilterSelectedEvent } from '../../events/duels/duels-top-decks-class-filter-selected-event';
import { Processor } from '../processor';

export class DuelsHeroFilterSelectedProcessor implements Processor {
	constructor(private readonly duelsService: DuelsStateBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsTopDecksHeroFilterSelectedEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const uniqueNormalizedHeroes: DuelsHeroFilterType = [
			...new Set(event.value.map((hero) => normalizeDuelsHeroCardId(hero) as CardIds)),
		];
		await this.prefs.updateDuelsHeroFilter(uniqueNormalizedHeroes);
		// Update hero power and signature treasure filters if not compatible with the new hero selection
		const prefs = await this.prefs.getPreferences();
		const configForSelectedHeroes = duelsHeroConfigs.filter((config) =>
			uniqueNormalizedHeroes.includes(normalizeDuelsHeroCardId(config.hero) as CardIds),
		);
		if (prefs.duelsActiveHeroPowerFilter !== 'all') {
			const conf = configForSelectedHeroes.find((conf) =>
				conf.heroPowers.includes(prefs.duelsActiveHeroPowerFilter as CardIds),
			);
			if (!conf) {
				await this.prefs.updateDuelsHeroPowerFilter('all');
			}
		}
		if (prefs.duelsActiveSignatureTreasureFilter !== 'all') {
			const conf = configForSelectedHeroes.find((conf) =>
				conf.signatureTreasures.includes(prefs.duelsActiveSignatureTreasureFilter as CardIds),
			);
			if (!conf) {
				await this.prefs.updateDuelsSignatureTreasureFilter('all');
			}
		}
		return [null, null];
	}
}

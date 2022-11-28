import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { DuelsDeckbuilderGoBackEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-go-back-event';
import { Processor } from '@services/mainwindow/store/processors/processor';

export class DuelsDeckbuilderGoBackProcessor implements Processor {
	public async process(
		event: DuelsDeckbuilderGoBackEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newHero = event.step === 'hero' ? null : currentState.duels.deckbuilder.currentHeroCardId;
		const newClasses = event.step === 'hero' ? [] : currentState.duels.deckbuilder.currentClasses;
		const newHeroPower =
			event.step === 'hero' || event.step === 'hero-power'
				? null
				: currentState.duels.deckbuilder.currentHeroPowerCardId;
		const newSignatureTreasure = null;
		return [
			currentState.update({
				duels: currentState.duels.update({
					deckbuilder: currentState.duels.deckbuilder.update({
						currentHeroCardId: newHero,
						currentClasses: newClasses,
						currentHeroPowerCardId: newHeroPower,
						currentSignatureTreasureCardId: newSignatureTreasure,
						currentCards: undefined,
					}),
				}),
			}),
			null,
		];
	}
}

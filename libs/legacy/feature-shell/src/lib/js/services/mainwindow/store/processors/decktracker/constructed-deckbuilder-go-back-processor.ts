import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedDeckbuilderGoBackEvent } from '@firestone/mainwindow/common';

export class ConstructedDeckbuilderGoBackProcessor implements Processor {
	public async process(
		event: ConstructedDeckbuilderGoBackEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newFormat = event.step === 'format' ? null : currentState.decktracker.deckbuilder.currentFormat;
		const newClass = event.step === 'class' ? null : currentState.decktracker.deckbuilder.currentClass;
		return [
			currentState.update({
				decktracker: currentState.decktracker.update({
					deckbuilder: currentState.decktracker.deckbuilder.update({
						currentFormat: newFormat,
						currentClass: newClass,
						currentCards: undefined,
					}),
				}),
			}),
			null,
		];
	}
}

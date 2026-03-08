import { Processor } from '../processor';
import {
	ConstructedDeckbuilderGoBackEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';

export class ConstructedDeckbuilderGoBackProcessor implements Processor {
	public async process(
		event: ConstructedDeckbuilderGoBackEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const newFormat = event.step === 'format' ? undefined : currentState.decktracker.deckbuilder.currentFormat;
		const newClass = event.step === 'class' ? undefined : currentState.decktracker.deckbuilder.currentClass;
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

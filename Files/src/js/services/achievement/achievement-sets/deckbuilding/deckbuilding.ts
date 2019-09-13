import { GenericSetProvider } from '../generic-set-provider';

export class DeckbuildingSetProvider extends GenericSetProvider {
	constructor() {
		super('deckbuilding', 'Deckbuilding', ['deckbuilding_win_classic'], 'deckbuilding');
	}
}

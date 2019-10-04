import { GenericSetProvider } from '../generic-set-provider';

export class DeckbuildingSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'deckbuilding',
			'Deckbuilding',
			[
				'deckbuilding_win_classic',
				'deckbuilding_win_epic',
				'deckbuilding_win_lifesteal',
				'deckbuilding_win_so_quiet',
				'deckbuilding_win_the_void',
				'deckbuilding_win_thousand_cuts',
			],
			'deckbuilding',
		);
	}
}

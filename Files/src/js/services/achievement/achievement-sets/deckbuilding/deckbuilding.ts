import { GenericSetProvider } from '../generic-set-provider';

export class DeckbuildingSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'deckbuilding',
			'Deckbuilding',
			[
				'deckbuilding_win_balanced',
				'deckbuilding_win_classic',
				'deckbuilding_win_complex',
				'deckbuilding_win_epic',
				'deckbuilding_win_fragile_nature',
				'deckbuilding_win_lifesteal',
				'deckbuilding_win_lone_survivor',
				'deckbuilding_win_minion',
				'deckbuilding_win_miracle',
				'deckbuilding_win_random',
				'deckbuilding_win_simple',
				'deckbuilding_win_so_quiet',
				'deckbuilding_win_sorcerer',
				'deckbuilding_win_summoner',
				'deckbuilding_win_sword_and_spell',
				'deckbuilding_win_the_void',
				'deckbuilding_win_thousand_cuts',
			],
			'deckbuilding',
		);
	}
}

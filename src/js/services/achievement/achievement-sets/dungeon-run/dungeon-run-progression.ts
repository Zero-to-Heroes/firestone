import { GenericSetProvider } from '../generic-set-provider';

export class DungeonRunProgressionSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'dungeon_run_progression',
			'Progression',
			[
				'dungeon_run_progression_HERO_01',
				'dungeon_run_progression_HERO_02',
				'dungeon_run_progression_HERO_03',
				'dungeon_run_progression_HERO_04',
				'dungeon_run_progression_HERO_05',
				'dungeon_run_progression_HERO_06',
				'dungeon_run_progression_HERO_07',
				'dungeon_run_progression_HERO_08',
				'dungeon_run_progression_HERO_09',
			],
			'achievements_progression',
		);
	}
}

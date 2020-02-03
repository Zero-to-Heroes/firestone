import { GenericSetProvider } from '../generic-set-provider';

export class RumbleRunPassivesSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'rumble_run_passive',
			'Passives',
			[
				'rumble_run_passive_play_TRLA_801',
				'rumble_run_passive_play_TRLA_802',
				'rumble_run_passive_play_TRLA_803',
				'rumble_run_passive_play_TRLA_804',
				'rumble_run_passive_play_TRLA_805',
				'rumble_run_passive_play_TRLA_806',
				'rumble_run_passive_play_TRLA_807',
				'rumble_run_passive_play_TRLA_808',
				'rumble_run_passive_play_TRLA_809',
			],
			'achievements_passive',
		);
	}
}

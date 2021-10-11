import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MercenariesBattleState } from '../../../../models/mercenaries/mercenaries-battle-state';
import { PreferencesService } from '../../../../services/preferences.service';

@Component({
	selector: 'mercenaries-opponent-team',
	styleUrls: [],
	template: ` <mercenaries-team-root [teamExtractor]="teamExtractor"></mercenaries-team-root>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesOpponentTeamComponent {
	teamExtractor = (state: MercenariesBattleState) => state.opponentTeam;

	constructor(private readonly prefs: PreferencesService) {}
}

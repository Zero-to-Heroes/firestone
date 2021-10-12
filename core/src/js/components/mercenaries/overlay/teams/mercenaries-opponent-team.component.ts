import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MercenariesBattleState } from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { PreferencesService } from '../../../../services/preferences.service';

@Component({
	selector: 'mercenaries-opponent-team',
	styleUrls: [],
	template: ` <mercenaries-team-root
		[teamExtractor]="teamExtractor"
		[trackerPositionUpdater]="trackerPositionUpdater"
		[trackerPositionExtractor]="trackerPositionExtractor"
		[defaultTrackerPositionLeftProvider]="defaultTrackerPositionLeftProvider"
		[defaultTrackerPositionTopProvider]="defaultTrackerPositionTopProvider"
	></mercenaries-team-root>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesOpponentTeamComponent {
	teamExtractor = (state: MercenariesBattleState) => state.opponentTeam;
	trackerPositionUpdater = (left: number, top: number) => this.prefs.updateMercenariesTeamOpponentPosition(left, top);
	trackerPositionExtractor = (prefs: Preferences) => prefs.mercenariesOpponentTeamOverlayPosition;
	// Because whitespace for the tooltips
	defaultTrackerPositionLeftProvider = (gameWidth: number, windowWidth: number) => -windowWidth / 2 + 250;
	defaultTrackerPositionTopProvider = (gameHeight: number, windowHeight: number) => 50;

	constructor(private readonly prefs: PreferencesService) {}
}

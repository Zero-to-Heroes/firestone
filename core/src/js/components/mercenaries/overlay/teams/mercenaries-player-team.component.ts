import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MercenariesBattleState } from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { PreferencesService } from '../../../../services/preferences.service';

@Component({
	selector: 'mercenaries-player-team',
	styleUrls: [],
	template: ` <mercenaries-team-root
		[teamExtractor]="teamExtractor"
		[side]="'player'"
		[trackerPositionUpdater]="trackerPositionUpdater"
		[trackerPositionExtractor]="trackerPositionExtractor"
		[defaultTrackerPositionLeftProvider]="defaultTrackerPositionLeftProvider"
		[defaultTrackerPositionTopProvider]="defaultTrackerPositionTopProvider"
	></mercenaries-team-root>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesPlayerTeamComponent {
	teamExtractor = (state: MercenariesBattleState) => state.playerTeam;
	trackerPositionUpdater = (left: number, top: number) => this.prefs.updateMercenariesTeamPlayerPosition(left, top);
	trackerPositionExtractor = (prefs: Preferences) => prefs.mercenariesPlayerTeamOverlayPosition;
	defaultTrackerPositionLeftProvider = (gameWidth: number, windowWidth: number) => gameWidth - windowWidth / 2 - 180;
	defaultTrackerPositionTopProvider = (gameHeight: number, windowHeight: number) => 10;

	constructor(private readonly prefs: PreferencesService) {}
}

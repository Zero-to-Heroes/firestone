import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { debounceTime, filter, map, tap } from 'rxjs/operators';
import { MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { PreferencesService } from '../../../../services/preferences.service';
import { AppUiStoreService, cdLog } from '../../../../services/ui-store/app-ui-store.service';

@Component({
	selector: 'mercenaries-player-team',
	styleUrls: [],
	template: ` <mercenaries-team-root
		[team$]="teamProvider$"
		[side]="'player'"
		[trackerPositionUpdater]="trackerPositionUpdater"
		[trackerPositionExtractor]="trackerPositionExtractor"
		[defaultTrackerPositionLeftProvider]="defaultTrackerPositionLeftProvider"
		[defaultTrackerPositionTopProvider]="defaultTrackerPositionTopProvider"
	></mercenaries-team-root>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesPlayerTeamComponent {
	// teamExtractor = (state: MercenariesBattleState) => state.playerTeam;
	trackerPositionUpdater = (left: number, top: number) => this.prefs.updateMercenariesTeamPlayerPosition(left, top);
	trackerPositionExtractor = (prefs: Preferences) => prefs.mercenariesPlayerTeamOverlayPosition;
	defaultTrackerPositionLeftProvider = (gameWidth: number, windowWidth: number) => gameWidth - windowWidth / 2 - 180;
	defaultTrackerPositionTopProvider = (gameHeight: number, windowHeight: number) => 10;
	teamProvider$: Observable<MercenariesBattleTeam>;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly store: AppUiStoreService,
		private readonly cdr: ChangeDetectorRef,
	) {
		this.teamProvider$ = this.store
			.listenMercenaries$(([battleState, prefs]) => battleState)
			.pipe(
				debounceTime(50),
				filter(([battleState]) => !!battleState),
				map(([battleState]) => battleState.playerTeam),
				map((team) =>
					team.update({
						...team,
						mercenaries: team.mercenaries.filter((merc) => !merc.isDead || !merc.creatorCardId),
					}),
				),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((filter) => cdLog('emitting team in ', this.constructor.name, filter)),
			);
	}
}

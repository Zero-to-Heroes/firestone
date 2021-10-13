import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { debounceTime, filter, map, tap } from 'rxjs/operators';
import { MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { PreferencesService } from '../../../../services/preferences.service';
import { AppUiStoreService, cdLog } from '../../../../services/ui-store/app-ui-store.service';

@Component({
	selector: 'mercenaries-opponent-team',
	styleUrls: [],
	template: ` <mercenaries-team-root
		[team$]="teamProvider$"
		[side]="'opponent'"
		[trackerPositionUpdater]="trackerPositionUpdater"
		[trackerPositionExtractor]="trackerPositionExtractor"
		[defaultTrackerPositionLeftProvider]="defaultTrackerPositionLeftProvider"
		[defaultTrackerPositionTopProvider]="defaultTrackerPositionTopProvider"
	></mercenaries-team-root>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesOpponentTeamComponent {
	// teamExtractor = (state: MercenariesBattleState) => state.opponentTeam;
	trackerPositionUpdater = (left: number, top: number) => this.prefs.updateMercenariesTeamOpponentPosition(left, top);
	trackerPositionExtractor = (prefs: Preferences) => prefs.mercenariesOpponentTeamOverlayPosition;
	// Because whitespace for the tooltips
	defaultTrackerPositionLeftProvider = (gameWidth: number, windowWidth: number) => -windowWidth / 2 + 250;
	defaultTrackerPositionTopProvider = (gameHeight: number, windowHeight: number) => 50;
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
				map(([battleState]) => battleState.opponentTeam),
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

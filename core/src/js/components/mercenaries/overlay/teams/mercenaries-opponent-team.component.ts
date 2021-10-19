import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { debounceTime, filter, map, tap } from 'rxjs/operators';
import { MercenariesBattleState, MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { PreferencesService } from '../../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { buildMercenariesTasksList } from '../../../../services/ui-store/mercenaries-ui-helper';
import { Task } from './mercenaries-team-root..component';

@Component({
	selector: 'mercenaries-opponent-team',
	styleUrls: [],
	template: `
		<mercenaries-team-root
			[team]="team$ | async"
			[tasks]="tasks$ | async"
			[side]="'opponent'"
			[trackerPositionUpdater]="trackerPositionUpdater"
			[trackerPositionExtractor]="trackerPositionExtractor"
			[showTasksExtractor]="showTasksExtractor"
			[defaultTrackerPositionLeftProvider]="defaultTrackerPositionLeftProvider"
			[defaultTrackerPositionTopProvider]="defaultTrackerPositionTopProvider"
		></mercenaries-team-root>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesOpponentTeamComponent {
	teamExtractor = (state: MercenariesBattleState) => state.opponentTeam;
	trackerPositionUpdater = (left: number, top: number) => this.prefs.updateMercenariesTeamOpponentPosition(left, top);
	trackerPositionExtractor = (prefs: Preferences) => prefs.mercenariesOpponentTeamOverlayPosition;
	showTasksExtractor = (prefs: Preferences) => prefs.mercenariesShowTaskButton;
	// Because whitespace for the tooltips
	defaultTrackerPositionLeftProvider = (gameWidth: number, windowWidth: number) => -windowWidth / 2 + 250;
	defaultTrackerPositionTopProvider = (gameHeight: number, windowHeight: number) => 50;

	team$: Observable<MercenariesBattleTeam>;
	tasks$: Observable<readonly Task[]>;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly store: AppUiStoreFacadeService,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		this.tasks$ = this.store
			.listen$(
				([main, nav, prefs]) => main.mercenaries.referenceData,
				([main, nav, prefs]) => main.mercenaries.collectionInfo?.Visitors,
			)
			.pipe(
				filter(([referenceData, visitors]) => !!visitors?.length),
				map(([referenceData, visitors]) => buildMercenariesTasksList(referenceData, visitors, this.allCards)),
			);
		this.team$ = this.store
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
				filter((team) => !!team),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((filter) => cdLog('emitting team in ', this.constructor.name, filter)),
			);
	}
}

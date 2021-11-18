import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { debounceTime, filter, map, takeUntil, tap } from 'rxjs/operators';
import { MercenariesBattleState, MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { PreferencesService } from '../../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { buildMercenariesTasksList } from '../../../../services/ui-store/mercenaries-ui-helper';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';
import { Task } from './mercenaries-team-root..component';

@Component({
	selector: 'mercenaries-player-team',
	styleUrls: [],
	template: `
		<mercenaries-team-root
			[team]="team$ | async"
			[tasks]="tasks$ | async"
			[side]="'player'"
			[trackerPositionUpdater]="trackerPositionUpdater"
			[trackerPositionExtractor]="trackerPositionExtractor"
			[showTasksExtractor]="showTasksExtractor"
			[scaleExtractor]="scaleExtractor"
			[defaultTrackerPositionLeftProvider]="defaultTrackerPositionLeftProvider"
			[defaultTrackerPositionTopProvider]="defaultTrackerPositionTopProvider"
		></mercenaries-team-root>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesPlayerTeamComponent extends AbstractSubscriptionComponent {
	teamExtractor = (state: MercenariesBattleState) => state.playerTeam;
	trackerPositionUpdater = (left: number, top: number) => this.prefs.updateMercenariesTeamPlayerPosition(left, top);
	trackerPositionExtractor = (prefs: Preferences) => prefs.mercenariesPlayerTeamOverlayPosition;
	showTasksExtractor = (prefs: Preferences) => prefs.mercenariesShowTaskButton;
	scaleExtractor = (prefs: Preferences) => prefs.mercenariesPlayerTeamOverlayScale;
	defaultTrackerPositionLeftProvider = (gameWidth: number, windowWidth: number) => gameWidth - windowWidth / 2 - 180;
	defaultTrackerPositionTopProvider = (gameHeight: number, windowHeight: number) => 10;

	team$: Observable<MercenariesBattleTeam>;
	tasks$: Observable<readonly Task[]>;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.tasks$ = this.store
			.listen$(
				([main, nav, prefs]) => main.mercenaries.referenceData,
				([main, nav, prefs]) => main.mercenaries.collectionInfo?.Visitors,
			)
			.pipe(
				filter(([referenceData, visitors]) => !!referenceData && !!visitors?.length),
				map(([referenceData, visitors]) => buildMercenariesTasksList(referenceData, visitors, this.allCards)),
				takeUntil(this.destroyed$),
			);
		this.team$ = this.store
			.listenMercenaries$(([battleState, prefs]) => battleState)
			.pipe(
				debounceTime(50),
				filter(([battleState]) => !!battleState),
				map(([battleState]) => battleState.playerTeam),
				map((team) =>
					team.update({
						...team,
						mercenaries: team.mercenaries?.filter((merc) => !merc.isDead || !merc.creatorCardId) ?? [],
					}),
				),
				filter((team) => !!team),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((filter) => cdLog('emitting team in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}
}

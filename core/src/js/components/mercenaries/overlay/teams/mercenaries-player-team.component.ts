import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { CardTooltipPositionType } from '../../../../directives/card-tooltip-position.type';
import { MercenariesBattleState, MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
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
			[showTasksExtractor]="showTasksExtractor"
			[scaleExtractor]="scaleExtractor"
			[tooltipPosition]="tooltipPosition"
			[showTurnCounter]="showTurnCounter$ | async"
		></mercenaries-team-root>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesPlayerTeamComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() tooltipPosition: CardTooltipPositionType = 'left';

	teamExtractor = (state: MercenariesBattleState) => state.playerTeam;
	showTasksExtractor = (prefs: Preferences) => prefs.mercenariesShowTaskButton;
	scaleExtractor = (prefs: Preferences) => prefs.mercenariesPlayerTeamOverlayScale;

	team$: Observable<MercenariesBattleTeam>;
	tasks$: Observable<readonly Task[]>;
	showTurnCounter$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.tasks$ = this.store
			.listen$(
				([main, nav, prefs]) => main.mercenaries.getReferenceData(),
				([main, nav, prefs]) => main.mercenaries.collectionInfo?.Visitors,
			)
			.pipe(
				filter(([referenceData, visitors]) => !!referenceData && !!visitors?.length),
				this.mapData(([referenceData, visitors]) =>
					buildMercenariesTasksList(referenceData, visitors, this.allCards, this.i18n),
				),
			);
		this.team$ = this.store
			.listenMercenaries$(([battleState, prefs]) => battleState)
			.pipe(
				debounceTime(50),
				filter(([battleState]) => !!battleState),
				this.mapData(([battleState]) =>
					battleState.playerTeam.update({
						...battleState.playerTeam,
						mercenaries:
							battleState.playerTeam.mercenaries?.filter((merc) => !merc.isDead || !merc.creatorCardId) ??
							[],
					}),
				),
			);
		this.showTurnCounter$ = this.listenForBasicPref$((prefs) => prefs.mercenariesShowTurnCounterInBattle);
	}
}

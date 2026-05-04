import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import {
	MercenariesBattleState,
	MercenariesBattleStateFacadeService,
	MercenariesBattleTeam,
} from '@firestone/mercenaries/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'mercenaries-player-team',
	styleUrls: [],
	template: `
		<mercenaries-team-root
			[team]="team$ | async"
			[side]="'player'"
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
	scaleExtractor = (prefs: Preferences) => prefs.mercenariesPlayerTeamOverlayScale;

	team$: Observable<MercenariesBattleTeam>;
	showTurnCounter$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly mercenariesBattleStateFacade: MercenariesBattleStateFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.mercenariesBattleStateFacade, this.prefs);

		this.team$ = this.mercenariesBattleStateFacade.store$$.pipe(
			debounceTime(250),
			filter((battleState) => !!battleState),
			this.mapData((battleState) =>
				battleState.playerTeam.update({
					...battleState.playerTeam,
					mercenaries:
						battleState.playerTeam.mercenaries?.filter((merc) => !merc.isDead || !merc.creatorCardId) ?? [],
				}),
			),
		);
		this.showTurnCounter$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.mercenariesShowTurnCounterInBattle),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

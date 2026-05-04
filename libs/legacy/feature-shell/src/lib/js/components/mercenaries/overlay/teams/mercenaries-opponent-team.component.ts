import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import {
	MercenariesBattleState,
	MercenariesBattleStateFacadeService,
	MercenariesBattleTeam,
} from '@firestone/mercenaries/common';
import { Preferences } from '@firestone/shared/common/service';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'mercenaries-opponent-team',
	styleUrls: [],
	template: `
		<mercenaries-team-root
			[team]="team$ | async"
			[side]="'opponent'"
			[scaleExtractor]="scaleExtractor"
			[tooltipPosition]="tooltipPosition"
		></mercenaries-team-root>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesOpponentTeamComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() tooltipPosition: CardTooltipPositionType = 'left';

	teamExtractor = (state: MercenariesBattleState) => state.opponentTeam;
	scaleExtractor = (prefs: Preferences) => prefs.mercenariesOpponentTeamOverlayScale;

	team$: Observable<MercenariesBattleTeam>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly mercenariesBattleStateFacade: MercenariesBattleStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.mercenariesBattleStateFacade);

		this.team$ = this.mercenariesBattleStateFacade.store$$.pipe(
			this.mapData((state) =>
				state?.opponentTeam.update({
					...state.opponentTeam,
					mercenaries:
						state.opponentTeam.mercenaries?.filter((merc) => !merc.isDead || !merc.creatorCardId) ?? [],
				}),
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

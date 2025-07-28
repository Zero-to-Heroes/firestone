import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { Preferences } from '@firestone/shared/common/service';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { Observable } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import { MercenariesBattleState, MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

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
export class MercenariesOpponentTeamComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	@Input() tooltipPosition: CardTooltipPositionType = 'left';

	teamExtractor = (state: MercenariesBattleState) => state.opponentTeam;
	scaleExtractor = (prefs: Preferences) => prefs.mercenariesOpponentTeamOverlayScale;

	team$: Observable<MercenariesBattleTeam>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.team$ = this.store
			.listenMercenaries$(([battleState, prefs]) => battleState)
			.pipe(
				debounceTime(50),
				filter(([battleState]) => !!battleState),
				map(([battleState]) => battleState.opponentTeam),
				this.mapData((team) =>
					team.update({
						...team,
						mercenaries: team.mercenaries?.filter((merc) => !merc.isDead || !merc.creatorCardId) ?? [],
					}),
				),
			);
	}
}

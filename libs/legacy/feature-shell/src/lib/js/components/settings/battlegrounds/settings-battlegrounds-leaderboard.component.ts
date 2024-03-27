import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'settings-battlegrounds-leaderboard',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/battlegrounds/settings-battlegrounds-general.component.scss`,
		`./settings-battlegrounds-leaderboard.component.scss`,
	],
	template: `
		<div
			class="battlegrounds-general"
			*ngIf="{ bgsUseLeaderboardDataInOverlay: bgsUseLeaderboardDataInOverlay$ | async } as value"
			scrollable
		>
			<div class="title" [owTranslate]="'settings.battlegrounds.leaderboard.title'"></div>
			<div class="text" [owTranslate]="'settings.battlegrounds.leaderboard.text'"></div>
			<div class="text" [owTranslate]="'settings.battlegrounds.leaderboard.text-2'"></div>
			<div class="text" [owTranslate]="'settings.battlegrounds.leaderboard.text-3'"></div>
			<div class="settings-group">
				<preference-toggle
					field="bgsUseLeaderboardDataInOverlay"
					[label]="'settings.battlegrounds.leaderboard.enable' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowMmrInLeaderboardOverlay"
					[ngClass]="{ disabled: !value.bgsUseLeaderboardDataInOverlay }"
					[label]="'settings.battlegrounds.leaderboard.show-in-leaderboard' | owTranslate"
					[tooltip]="'settings.battlegrounds.leaderboard.show-in-leaderboard-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowMmrInOpponentRecap"
					[ngClass]="{ disabled: !value.bgsUseLeaderboardDataInOverlay }"
					[label]="'settings.battlegrounds.leaderboard.show-in-opponent-recap' | owTranslate"
					[tooltip]="'settings.battlegrounds.leaderboard.show-in-opponent-recap-tooltip' | owTranslate"
				></preference-toggle>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBattlegroundsLeaderboardComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	bgsUseLeaderboardDataInOverlay$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();

		this.bgsUseLeaderboardDataInOverlay$ = this.prefs
			.preferences$((prefs) => prefs.bgsUseLeaderboardDataInOverlay)
			.pipe(this.mapData(([pref]) => pref));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { ArenaDraftManagerService } from '@legacy-import/src/lib/js/services/arena/arena-draft-manager.service';
import { Observable, combineLatest } from 'rxjs';
import { ArenaCardStatsService } from '../../services/arena-card-stats.service';
import { ArenaCardOption } from './model';

@Component({
	selector: 'arena-card-selection',
	styleUrls: ['./arena-card-selection.component.scss'],
	template: `
		<div class="root" *ngIf="showing$ | async">
			<arena-card-option class="option" *ngFor="let option of options$ | async" [card]="option">
			</arena-card-option>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardSelectionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showing$: Observable<boolean>;
	options$: Observable<readonly ArenaCardOption[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly draftManager: ArenaDraftManagerService,
		private readonly arenaCardStats: ArenaCardStatsService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.draftManager.isReady();
		await this.arenaCardStats.isReady();
		await this.prefs.isReady();
		console.debug('[arena-card-selection] ready');

		// TODO: load the context of the current class
		// So this means storing somewhere the current draft info (including the decklist)
		// this.updateClassContext();

		this.options$ = combineLatest([this.draftManager.cardOptions$$, this.arenaCardStats.cardStats$$]).pipe(
			this.mapData(
				([options, stats]) =>
					options?.map((option) => {
						const stat = stats?.find((s) => s.cardId === option);
						const drawnWinrate = !stat?.stats?.drawn ? null : stat.stats.drawnThenWin / stat.stats.drawn;
						return {
							cardId: option,
							drawnWinrate: drawnWinrate,
						} as ArenaCardOption;
					}) ?? [],
			),
		);
		this.showing$ = this.options$.pipe(this.mapData((options) => options.length > 0));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

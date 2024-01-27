import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	Input,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, tap } from 'rxjs';
import { ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD } from '../../services/arena-card-stats.service';
import { ArenaCardOption } from './model';

@Component({
	selector: 'arena-card-option',
	styleUrls: ['./arena-card-option.component.scss'],
	template: `
		<div class="option" *ngIf="{ showWidget: showWidget$ | async } as value">
			<div class="info-container" *ngIf="value.showWidget">
				<div class="stat winrate">
					<span class="label" [fsTranslate]="'app.arena.draft.card-drawn-winrate'"></span>
					<span class="value">{{ drawnWinrate }}</span>
				</div>
				<div class="stat pickrate">
					<span class="label" [fsTranslate]="'app.arena.card-stats.header-pickrate'"></span>
					<span class="value">{{ pickrate }}</span>
				</div>
				<div class="stat pickrate-delta">
					<span class="label" [helpTooltip]="pickRateImpactTooltip">{{ pickRateHighWinsLabel }}</span>
					<span class="value">{{ pickRateHighWins }}</span>
				</div>
			</div>
			<arena-option-info-premium *ngIf="!value.showWidget"></arena-option-info-premium>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardOptionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showWidget$: Observable<boolean>;

	@Input() set card(value: ArenaCardOption) {
		console.debug('[arena-card-option] setting card', value);
		this.drawnWinrate = value.drawnWinrate == null ? '-' : (100 * value.drawnWinrate).toFixed(1) + '%';
		this.pickrate = value.pickRate == null ? '-' : (100 * value.pickRate).toFixed(1) + '%';
		this.pickRateHighWins = value.pickRateHighWins == null ? '-' : (100 * value.pickRateHighWins).toFixed(1) + '%';
	}

	@Input() set pickNumber(value: number) {
		this.pickNumber$$.next(value);
	}

	drawnWinrate: string;
	pickrate: string;
	pickRateHighWins: string;

	pickRateHighWinsLabel = this.i18n.translateString(`app.arena.card-stats.header-pickrate-high-wins`, {
		value: ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD,
	});
	pickRateImpactTooltip = this.i18n.translateString(`app.arena.card-stats.header-pickrate-high-wins-tooltip`, {
		value: ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD,
	});

	private pickNumber$$ = new BehaviorSubject<number>(0);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.ads.isReady();

		this.showWidget$ = combineLatest([this.pickNumber$$, this.ads.hasPremiumSub$$]).pipe(
			tap((info) => console.debug('[arena-card-option] showWidget', info)),
			this.mapData(([pickNumber, hasPremium]) => pickNumber === 0 || hasPremium),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

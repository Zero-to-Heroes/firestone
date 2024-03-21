import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, sleep } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, tap } from 'rxjs';
import { ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD } from '../../services/arena-card-stats.service';
import { ArenaCardOption } from './model';

@Component({
	selector: 'arena-card-option',
	styleUrls: ['./arena-card-option.component.scss'],
	template: `
		<div class="option " *ngIf="{ showWidget: showWidget$ | async } as value">
			<div class="info-container scalable" *ngIf="value.showWidget">
				<div class="stat winrate ">
					<span class="label" [fsTranslate]="'app.arena.draft.card-drawn-impact'"></span>
					<span class="value {{ winrateClass }}" [helpTooltip]="drawnImpactTooltip">{{ drawImpact }}</span>
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
		this.drawImpact = value.drawnImpact == null ? '-' : (100 * value.drawnImpact).toFixed(2);
		this.winrateClass = value.drawnImpact == null ? '' : value.drawnImpact > 0 ? 'positive' : 'negative';
		this.pickrate = value.pickRate == null ? '-' : (100 * value.pickRate).toFixed(1) + '%';
		this.pickRateHighWins = value.pickRateHighWins == null ? '-' : (100 * value.pickRateHighWins).toFixed(1) + '%';
		this.drawnImpactTooltip = this.i18n.translateString(`app.arena.draft.card-drawn-impact-tooltip`, {
			drawWinrate: this.drawnWinrate,
		});
	}

	@Input() set pickNumber(value: number) {
		this.pickNumber$$.next(value);
	}

	drawnWinrate: string;
	drawImpact: string;
	winrateClass: string;
	pickrate: string;
	pickRateHighWins: string;
	drawnImpactTooltip: string | null;

	pickRateHighWinsLabel = this.i18n.translateString(`app.arena.card-stats.header-pickrate-high-wins-short`, {
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
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.ads.isReady();

		this.showWidget$ = combineLatest([this.pickNumber$$, this.ads.hasPremiumSub$$]).pipe(
			tap((info) => console.debug('[arena-card-option] showWidget', info)),
			this.mapData(([pickNumber, hasPremium]) => pickNumber === 0 || hasPremium),
		);
		this.prefs
			.preferences$((prefs) => prefs.arenaDraftOverlayScale)
			.pipe(this.mapData(([value]) => value))
			.subscribe(async (value) => {
				const newScale = value / 100;
				const element = await this.getScalable();
				this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				// this.renderer.setStyle(element, 'top', `calc(${newScale} * 1.5vh)`);
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async getScalable(): Promise<ElementRef<HTMLElement>> {
		let element = this.el.nativeElement.querySelector('.scalable');
		let retriesLeft = 10;
		while (!element && retriesLeft > 0) {
			await sleep(200);
			element = this.el.nativeElement.querySelector('.scalable');
			retriesLeft--;
		}
		return element;
	}
}

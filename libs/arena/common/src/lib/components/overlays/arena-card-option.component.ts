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
import { BehaviorSubject, Observable, combineLatest, filter, switchMap, takeUntil } from 'rxjs';
import { ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD } from '../../services/arena-card-stats.service';
import { ArenaCardOption } from './model';

@Component({
	selector: 'arena-card-option',
	styleUrls: ['./arena-card-option.component.scss'],
	template: `
		<ng-container *ngIf="widgetActive$ | async">
			<div class="option " *ngIf="{ showWidget: showWidget$ | async } as value">
				<arena-card-option-view
					class="info-view"
					[card]="card"
					*ngIf="value.showWidget"
				></arena-card-option-view>
				<arena-option-info-premium
					*ngIf="!value.showWidget"
					[conditionalOnField]="'arenaShowCardSelectionOverlayPremiumBanner'"
				></arena-option-info-premium>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardOptionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	widgetActive$: Observable<boolean>;
	showWidget$: Observable<boolean>;

	@Input() card: ArenaCardOption;

	@Input() set pickNumber(value: number) {
		this.pickNumber$$.next(value);
	}

	drawnWinrate: string;
	deckWinrate: string;
	drawImpact: string;
	deckImpact: string;
	drawWinrateClass: string;
	deckWinrateClass: string;
	pickrate: string;
	pickRateHighWins: string;
	drawnImpactTooltip: string | null;
	deckImpactTooltip: string | null;

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

		this.widgetActive$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.arenaShowCardSelectionOverlay),
		);
		this.showWidget$ = combineLatest([this.pickNumber$$, this.ads.hasPremiumSub$$]).pipe(
			// tap((info) => console.debug('[arena-card-option] showWidget', info)),
			this.mapData(([pickNumber, hasPremium]) => pickNumber === 0 || hasPremium),
		);
		combineLatest([this.showWidget$, this.widgetActive$])
			.pipe(
				filter(([showWidget, widgetActive]) => showWidget && widgetActive),
				switchMap(() =>
					combineLatest([
						this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
						this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaDraftOverlayScale ?? 100)),
					]),
				),
				takeUntil(this.destroyed$),
			)
			.subscribe(async ([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				const element = await this.getScalable();
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
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

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
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, debounceTime, shareReplay, takeUntil } from 'rxjs';
import { ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD } from '../../services/arena-card-stats.service';
import { ArenaDraftGuardianService } from '../../services/arena-draft-guardian.service';
import { ArenaDraftManagerService } from '../../services/arena-draft-manager.service';
import { ArenaCardOption } from './model';

@Component({
	standalone: false,
	selector: 'arena-card-option',
	styleUrls: ['./arena-card-option.component.scss'],
	template: `
		<ng-container *ngIf="widgetActive$ | async">
			<div class="option " *ngIf="{ showWidget: showWidget$ | async } as value">
				<arena-card-option-view
					class="info-view"
					[card]="card"
					*ngIf="value.showWidget === true"
				></arena-card-option-view>
				<arena-option-info-premium
					*ngIf="value.showWidget === false"
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
		private readonly guardian: ArenaDraftGuardianService,
		private readonly draftManager: ArenaDraftManagerService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads, this.guardian);

		this.widgetActive$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.arenaShowCardSelectionOverlay),
		);
		this.showWidget$ = combineLatest([
			this.pickNumber$$,
			this.ads.hasPremiumSub$$,
			this.guardian.freeUsesLeft$$,
		]).pipe(
			// debounceTime(500),
			this.mapData(
				([pickNumber, hasPremium, freeUsesLeft]) => pickNumber === 0 || hasPremium || freeUsesLeft >= 0,
			),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.draftManager.currentDeck$$.pipe(debounceTime(1000)).subscribe((deck) => {
			if (!deck?.Id) {
				return;
			}

			const runId = deck.Id;
			this.guardian.acknowledgeRunUsed(runId);
		});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

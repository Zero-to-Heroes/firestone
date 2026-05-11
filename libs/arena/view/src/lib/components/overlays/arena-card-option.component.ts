import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	Input,
	ViewRef,
} from '@angular/core';
import { ArenaCardOption, ArenaDraftGuardianService, ArenaDraftManagerService } from '@firestone/arena/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, debounceTime, shareReplay, takeUntil } from 'rxjs';

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

	private pickNumber$$ = new BehaviorSubject<number>(0);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
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
			this.cdr.markForCheck();
		}
	}
}

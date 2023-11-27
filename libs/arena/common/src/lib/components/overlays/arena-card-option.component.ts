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
import { ADS_SERVICE_TOKEN, IAdsService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, tap } from 'rxjs';
import { ArenaCardOption } from './model';

@Component({
	selector: 'arena-card-option',
	styleUrls: ['./arena-card-option.component.scss'],
	template: `
		<div class="option" *ngIf="{ showWidget: showWidget$ | async } as value">
			<div class="info-container" *ngIf="value.showWidget">
				<div class="winrate">
					<span class="label" [fsTranslate]="'app.arena.draft.card-drawn-winrate'"></span>
					<span class="value">{{ drawnWinrate }}</span>
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
		this.drawnWinrate = (100 * value.drawnWinrate).toFixed(1) + '%';
	}

	@Input() set pickNumber(value: number) {
		this.pickNumber$$.next(value);
	}

	drawnWinrate: string;

	private pickNumber$$ = new BehaviorSubject<number>(0);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
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

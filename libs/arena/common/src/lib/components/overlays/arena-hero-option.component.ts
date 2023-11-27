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
import { Observable, tap } from 'rxjs';
import { ArenaHeroOption } from './model';

@Component({
	selector: 'arena-hero-option',
	styleUrls: ['./arena-hero-option.component.scss'],
	template: `
		<div class="option" *ngIf="{ showWidget: showWidget$ | async } as value">
			<div class="info-container" *ngIf="value.showWidget">
				<div class="tier">
					<span class="label" [fsTranslate]="'app.arena.draft.hero-tier'"></span>
					<span class="value {{ tier.toLowerCase() }}">{{ tier }}</span>
				</div>
				<div class="winrate">
					<span class="label" [fsTranslate]="'app.arena.draft.hero-winrate'"></span>
					<span class="value">{{ winrate }}</span>
				</div>
			</div>
			<arena-option-info-premium *ngIf="!value.showWidget"></arena-option-info-premium>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaHeroOptionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showWidget$: Observable<boolean>;

	@Input() set hero(value: ArenaHeroOption) {
		this.tier = value.tier;
		this.winrate = (100 * value.winrate).toFixed(1) + '%';
	}

	tier: string;
	winrate: string;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.ads.isReady();

		this.showWidget$ = this.ads.hasPremiumSub$$.pipe(
			this.mapData((info) => info),
			tap((info) => console.debug('[arena-hero-option] showWidget', info)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

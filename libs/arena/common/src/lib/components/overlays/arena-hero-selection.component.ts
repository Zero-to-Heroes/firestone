import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { Observable, combineLatest, shareReplay, tap } from 'rxjs';
import { ArenaClassStatsService } from '../../services/arena-class-stats.service';
import {
	ARENA_DRAFT_MANAGER_SERVICE_TOKEN,
	IArenaDraftManagerService,
} from '../../services/arena-draft-manager.interface';
import { buildArenaClassInfoTiers } from '../class-info/arena-class-tier-list.component';
import { ArenaHeroOption } from './model';

@Component({
	selector: 'arena-hero-selection',
	styleUrls: ['./arena-hero-selection.component.scss'],
	template: `
		<div class="root" *ngIf="showing$ | async">
			<arena-hero-option class="option" *ngFor="let option of options$ | async" [hero]="option">
			</arena-hero-option>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaHeroSelectionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showing$: Observable<boolean>;
	options$: Observable<readonly ArenaHeroOption[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ARENA_DRAFT_MANAGER_SERVICE_TOKEN) private readonly draftManager: IArenaDraftManagerService,
		private readonly arenaClassStats: ArenaClassStatsService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.draftManager.isReady();
		await this.arenaClassStats.isReady();
		console.debug('[arena-hero-selection] ready');

		const tiers$ = this.arenaClassStats.classStats$$.pipe(
			tap((info) => console.debug('[arena-class-tier-list] received info a', info)),
			this.mapData((stats) => {
				return buildArenaClassInfoTiers(stats, null, this.i18n);
			}),
			shareReplay(1),
			tap((info) => console.debug('[arena-class-tier-list] received info 1', info)),
			this.mapData((tiers) => tiers),
		);
		this.options$ = combineLatest([this.draftManager.heroOptions$$, tiers$]).pipe(
			tap((info) => console.debug('[arena-class-tier-list] received info b', info)),
			this.mapData(
				([options, tiers]) =>
					options?.map((option) => {
						const heroClass = this.allCards.getCard(option)?.classes?.[0]?.toLowerCase() ?? 'neutral';
						const classStat = tiers?.flatMap((tier) => tier.items).find((i) => i.playerClass === heroClass);
						const tier = !!classStat ? tiers?.find((tier) => tier.items.includes(classStat)) : null;
						return {
							cardId: option,
							winrate: classStat?.winrate,
							tier: tier?.id,
						} as ArenaHeroOption;
					}) ?? [],
			),
		);
		this.showing$ = this.options$.pipe(this.mapData((options) => options.length > 0));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

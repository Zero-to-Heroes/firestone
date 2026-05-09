import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import {
	ARENA_DRAFT_MANAGER_SERVICE_TOKEN,
	ArenaClassStatsService,
	ArenaHeroOption,
	ArenaMetaHeroStrategiesService,
	consolidateByHeroPower,
	IArenaDraftManagerService,
} from '@firestone/arena/common';
import { PatchesConfigService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, Observable, shareReplay, tap } from 'rxjs';
import { buildArenaClassInfoTiers } from '../class-info/arena-class-tier-list.component';

@Component({
	standalone: false,
	selector: 'arena-hero-power-selection',
	styleUrls: ['./arena-hero-power-selection.component.scss'],
	template: `
		<div class="root" *ngIf="showing$ | async">
			<arena-hero-power-option class="option" *ngFor="let option of options$ | async" [hero]="option">
			</arena-hero-power-option>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaHeroPowerSelectionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showing$: Observable<boolean>;
	options$: Observable<readonly ArenaHeroOption[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ARENA_DRAFT_MANAGER_SERVICE_TOKEN) private readonly draftManager: IArenaDraftManagerService,
		private readonly arenaClassStats: ArenaClassStatsService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly arenaMetaHeroStrategies: ArenaMetaHeroStrategiesService,
		private readonly patches: PatchesConfigService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.draftManager, this.arenaClassStats, this.arenaMetaHeroStrategies, this.patches);

		const tiers$ = combineLatest([
			this.arenaClassStats.classStatsRaw$$,
			this.arenaMetaHeroStrategies.strategies$$,
			this.patches.config$$,
		]).pipe(
			this.mapData(([stats, strategies, config]) => {
				const mergedByHeroPower = consolidateByHeroPower(stats, this.allCards);
				return buildArenaClassInfoTiers(mergedByHeroPower?.stats, strategies?.heroes, null, config, this.i18n);
			}),
			shareReplay(1),
			this.mapData((tiers) => tiers),
		);
		this.options$ = combineLatest([this.draftManager.heroPowerOptions$$, tiers$]).pipe(
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
							tip: classStat?.tip,
						} as ArenaHeroOption;
					}) ?? [],
			),
			tap((info) => console.debug('[arena-hero-power-selection] received info b', info)),
		);
		this.showing$ = this.options$.pipe(this.mapData((options) => options.length > 0));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

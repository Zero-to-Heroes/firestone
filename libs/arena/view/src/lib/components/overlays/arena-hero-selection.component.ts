import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { normalizeHeroPower } from '@firestone-hs/reference-data';
import {
	ARENA_DRAFT_MANAGER_SERVICE_TOKEN,
	ArenaClassStatsService,
	ArenaHeroOption,
	ArenaMetaHeroStrategiesService,
	consolidateByPlayerClass,
	IArenaDraftManagerService,
} from '@firestone/arena/common';
import { PatchesConfigService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, Observable, shareReplay, takeUntil, tap } from 'rxjs';
import { buildArenaClassInfoTiers } from '../class-info/arena-class-tier-list.component';

@Component({
	standalone: false,
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
		private readonly arenaMetaHeroStrategies: ArenaMetaHeroStrategiesService,
		private readonly patches: PatchesConfigService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.draftManager, this.arenaClassStats, this.arenaMetaHeroStrategies, this.patches);
		console.debug('[arena-hero-selection] ready');

		const consolidatedStats$ = this.arenaClassStats.classStatsRaw$$.pipe(
			this.mapData((stats) => consolidateByPlayerClass(stats)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		const isDualClass$ = this.draftManager.currentDeck$$.pipe(
			this.mapData((deck) => !!deck?.HeroPowerCardId),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		const tiers$ = combineLatest([
			isDualClass$,
			this.draftManager.currentDeck$$,
			this.arenaClassStats.classStatsRaw$$,
			consolidatedStats$,
			this.arenaMetaHeroStrategies.strategies$$,
			this.patches.config$$,
		]).pipe(
			tap((info) => console.debug('[arena-class-tier-list] received info a', info)),
			this.mapData(([isDualClass, currentDeck, stats, consolidatedStats, strategies, config]) => {
				const baseStats = isDualClass
					? stats?.stats.filter(
							(s) =>
								s.playerHeroPower ===
								normalizeHeroPower(currentDeck!.HeroPowerCardId!, this.allCards.getService()),
						)
					: consolidatedStats?.stats;
				const result = buildArenaClassInfoTiers(baseStats, strategies?.heroes, null, config, this.i18n);
				console.debug('[arena-class-tier-list] result', isDualClass, result, baseStats, currentDeck);
				return result;
			}),
			shareReplay(1),
			tap((info) => console.debug('[arena-class-tier-list] received info 1', info)),
			this.mapData((tiers) => tiers),
		);
		// TODO: show more detailed options (average hero stat across all hero powers, if relevant)
		this.options$ = combineLatest([this.draftManager.heroOptions$$, tiers$, isDualClass$, consolidatedStats$]).pipe(
			tap((info) => console.debug('[arena-class-tier-list] received info b', info)),
			this.mapData(
				([options, tiers, isDualClass, consolidatedStats]) =>
					options?.map((option) => {
						const heroClass = this.allCards.getCard(option)?.classes?.[0]?.toLowerCase() ?? 'neutral';
						const classStat = tiers?.flatMap((tier) => tier.items).find((i) => i.playerClass === heroClass);
						const tier = !!classStat ? tiers?.find((tier) => tier.items.includes(classStat)) : null;
						const averageHeroStat = isDualClass
							? consolidatedStats?.stats.find((s) => s.playerClass === heroClass)
							: null;
						const contexts = isDualClass ? [option, classStat?.heroPower ?? null] : [option];
						const additionalStat: ArenaHeroOption | null = !isDualClass
							? null
							: {
									cardId: option,
									contextCardIds: [option],
									winrate: averageHeroStat?.totalGames
										? averageHeroStat?.totalsWins / averageHeroStat?.totalGames
										: null,
									tier: null,
									tip: null,
									averageHeroStat: null,
								};
						const result: ArenaHeroOption = {
							cardId: option,
							contextCardIds: contexts.filter((c) => c !== null),
							winrate: classStat?.winrate,
							tier: tier?.id,
							tip: classStat?.tip,
							averageHeroStat: additionalStat,
						};
						return result;
					}) ?? [],
			),
			tap((info) => console.debug('[arena-hero-selection] received info c', info)),
		);
		this.showing$ = this.options$.pipe(this.mapData((options) => options.length > 0));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

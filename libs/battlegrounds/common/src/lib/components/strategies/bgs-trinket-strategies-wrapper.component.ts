/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { PatchInfo, PatchesConfigService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Strategy } from '../../models/strategies';
import { BgsHeroStratAuthor, BgsMetaHeroStrategiesService } from '../../services/bgs-meta-hero-strategies.service';
import { BgsMetaTrinketStrategiesService, BgsTrinketTipItem } from '../../services/bgs-meta-trinket-strategies.service';

@Component({
	selector: 'bgs-trinket-strategies-wrapper',
	styleUrls: [`./bgs-trinket-strategies-wrapper.component.scss`],
	template: `
		<div class="strategies" *ngIf="{ strategies: strategies$ | async } as value">
			<bgs-strategies-view [strategies]="value.strategies"></bgs-strategies-view>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsTrinketStrategiesWrapperComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() set cardId(value: string) {
		this.cardId$$.next(value);
	}

	strategies$: Observable<readonly Strategy[]>;

	private cardId$$ = new BehaviorSubject<string | null>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly strategies: BgsMetaTrinketStrategiesService,
		private readonly refStrats: BgsMetaHeroStrategiesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.patchesConfig, this.strategies, this.refStrats);

		this.strategies$ = combineLatest([
			this.cardId$$.asObservable(),
			this.strategies.strategies$$,
			this.refStrats.strategies$$,
			this.patchesConfig.config$$,
		]).pipe(
			filter(([heroId, strats, refStrats, patchConfig]) => !!strats?.length && !!refStrats?.authors?.length),
			this.mapData(([trinketId, strats, refStrats, patchConfig]) => {
				const stratsForTrinket: readonly BgsTrinketTipItem[] =
					strats!.find((s) => s.id === trinketId)?.tips ?? [];
				return [...stratsForTrinket].sort(sortByProperties((s) => [-s.patch])).map((strat) => {
					const author: BgsHeroStratAuthor = refStrats!.authors.find((a) => a.id === strat.author)!;
					const patch: PatchInfo | undefined = patchConfig?.patches?.find((p) => p.number === strat.patch);
					const result: Strategy = {
						date: this.i18n.translateString('app.battlegrounds.strategies.date', {
							date: new Date(strat.date).toLocaleString(this.i18n.formatCurrentLocale()!, {
								year: 'numeric',
								month: 'short',
								day: '2-digit',
							}),
							patch: patch?.version ?? strat.patch,
						}),
						summary: strat.summary,
						author: {
							name: author?.name,
							tooltip: author?.highlights,
							link: `${author?.link}?utm_source=firestone`,
						},
					};
					return result;
				});
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

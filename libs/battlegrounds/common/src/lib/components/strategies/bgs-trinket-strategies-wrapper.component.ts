/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import {
	ExpertContributor,
	ExpertContributorsService,
	PatchInfo,
	PatchesConfigService,
} from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Strategy } from '../../models/strategies';
import { BgsMetaTrinketStrategiesService, BgsTrinketTipItem } from '../../services/bgs-meta-trinket-strategies.service';

@Component({
	standalone: false,
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
		private readonly contributors: ExpertContributorsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.patchesConfig, this.strategies, this.contributors);

		this.strategies$ = combineLatest([
			this.cardId$$.asObservable(),
			this.strategies.strategies$$,
			this.contributors.contributors$$,
			this.patchesConfig.config$$,
		]).pipe(
			filter(([heroId, strats, contributors, patchConfig]) => !!strats?.length && !!contributors?.length),
			this.mapData(([trinketId, strats, contributors, patchConfig]) => {
				const stratsForTrinket: readonly BgsTrinketTipItem[] =
					strats!.find((s) => s.cardId === trinketId)?.tips ?? [];
				return [...stratsForTrinket].sort(sortByProperties((s) => [-s.patch])).map((strat) => {
					const author: ExpertContributor = contributors!.find((a) => a.id === strat.author)!;
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

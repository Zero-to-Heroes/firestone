import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import {
	BgsHeroCurveActionExtended,
	BgsHeroStratTip,
	BgsMetaHeroStrategiesService,
	LocalizedBgsHeroCurve,
	LocalizedBgsHeroCurveStep,
	Strategy,
} from '@firestone/battlegrounds/common';
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

@Component({
	standalone: false,
	selector: 'bgs-strategies-wrapper',
	styleUrls: [`./bgs-strategies.component.scss`],
	template: `
		<div class="strategies" *ngIf="{ strategies: strategies$ | async } as value">
			<bgs-strategies-view [strategies]="value.strategies"></bgs-strategies-view>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsStrategiesWrapperComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() set heroId(value: string) {
		this.heroId$$.next(value);
	}

	strategies$: Observable<readonly Strategy[]>;

	private heroId$$ = new BehaviorSubject<string>(null);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly strategies: BgsMetaHeroStrategiesService,
		private readonly contributors: ExpertContributorsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.patchesConfig, this.strategies, this.contributors);

		this.strategies$ = combineLatest([
			this.heroId$$.asObservable(),
			this.strategies.strategies$$,
			this.contributors.contributors$$,
			this.patchesConfig.config$$,
		]).pipe(
			filter(([heroId, strats, contributors, patchConfig]) => !!strats?.heroes?.length && !!contributors?.length),
			this.mapData(([heroId, strats, contributors, patchConfig]) => {
				console.debug('strats', strats, heroId, contributors);
				const stratsForHero: readonly BgsHeroStratTip[] =
					strats.heroes.find((h) => h.cardId === normalizeHeroCardId(heroId, this.allCards))?.tips ?? [];
				console.debug(
					'stratsForHero',
					normalizeHeroCardId(heroId, this.allCards),
					stratsForHero,
					strats.heroes.find((h) => h.cardId === normalizeHeroCardId(heroId, this.allCards)),
				);

				return [...stratsForHero].sort(sortByProperties((s) => [-s.patch])).map((strat) => {
					const author: ExpertContributor = contributors.find((a) => a.id === strat.author);
					const patch: PatchInfo = patchConfig?.patches?.find((p) => p.number === strat.patch);
					const result: Strategy = {
						date: this.i18n.translateString('app.battlegrounds.strategies.date', {
							date: new Date(strat.date).toLocaleString(this.i18n.formatCurrentLocale(), {
								year: 'numeric',
								month: 'short',
								day: '2-digit',
							}),
							patch: patch?.version ?? strat.patch,
						}),
						summary: strat.summary,
						curves:
							strat.curves
								?.map((curveId) => strats.curves?.find((c) => c.id === curveId))
								.filter((curve) => !!curve)
								.map((curve) => {
									const result: LocalizedBgsHeroCurve = {
										...curve,
										name: this.i18n.translateString(
											`app.battlegrounds.strategies.curve.name.${curve.id}`,
										),
										notes: this.i18n.translateString(
											`app.battlegrounds.strategies.curve.notes.${curve.id}`,
										),
										steps: curve.steps.map((step) => {
											const result: LocalizedBgsHeroCurveStep = {
												...step,
												turnLabel: this.i18n.translateString(
													`app.battlegrounds.strategies.curve.step.turn`,
													{
														value: step.turn,
													},
												),
												goldLabel: this.i18n.translateString(
													`app.battlegrounds.strategies.curve.step.gold`,
													{
														value: step.turn + 2,
													},
												),
												localizedActions: step.actions.map((action) => {
													if ((action as BgsHeroCurveActionExtended).type) {
														return this.i18n.translateString(
															`app.battlegrounds.strategies.curve.action.${
																(action as BgsHeroCurveActionExtended).type
															}`,
															{
																value: (action as BgsHeroCurveActionExtended).param,
															},
														);
													} else {
														return this.i18n.translateString(
															`app.battlegrounds.strategies.curve.action.${action}`,
														);
													}
												}),
											};
											return result;
										}),
									};
									return result;
								}) ?? [],
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

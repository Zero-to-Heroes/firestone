import { ComponentType } from '@angular/cdk/portal';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { PatchInfo } from '@legacy-import/src/lib/js/models/patches';
import {
	BgsHeroCurve,
	BgsHeroCurveActionExtended,
	BgsHeroCurveStep,
	BgsHeroStratAuthor,
	BgsHeroStratTip,
} from '@legacy-import/src/lib/js/services/battlegrounds/bgs-meta-hero-strategies.service';
import { currentBgHeroId } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';
import { BgsStrategyCurveComponent } from './bgs-strategy-curve.component';

@Component({
	selector: 'bgs-strategies',
	styleUrls: [`../../../../../css/component/battlegrounds/desktop/strategy/bgs-strategies.component.scss`],
	template: `
		<div class="strategies" *ngIf="{ strategies: strategies$ | async } as value">
			<div class="strategy" *ngFor="let strat of value.strategies">
				<div class="summary">
					<div class="background"></div>
					<blockquote class="text" [innerHTML]="strat.summary"></blockquote>
					<div class="curves" *ngIf="strat.curves?.length">
						<div class="label" [owTranslate]="'app.battlegrounds.strategies.curve-label'"></div>
						<div
							class="curve"
							*ngFor="let curve of strat.curves"
							componentTooltip
							[componentType]="componentType"
							[componentInput]="curve"
						>
							{{ curve.name }}
						</div>
					</div>
				</div>
				<div class="author">
					<div class="name" [helpTooltip]="strat.author?.tooltip" *ngIf="!strat.author?.link">
						{{ strat.author?.name }}
					</div>
					<a
						class="name"
						[helpTooltip]="strat.author?.tooltip"
						*ngIf="strat.author?.link"
						href="{{ strat.author?.link }}"
						target="_blank"
						>{{ strat.author?.name }}</a
					>
					<div class="date">{{ strat.date }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsStrategiesComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	componentType: ComponentType<BgsStrategyCurveComponent> = BgsStrategyCurveComponent;

	strategies$: Observable<readonly Strategy[]>;

	loading = true;
	visible = false;

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.strategies$ = this.store
			.listen$(
				([main]) => main.battlegrounds.getMetaHeroStrategies(),
				([main]) => main.patchConfig,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
			)
			.pipe(
				filter(([strats, patchConfig, categoryId]) => !!strats?.heroes?.length),
				this.mapData(([strats, patchConfig, categoryId]) => {
					console.debug('strats', strats);
					const heroId = currentBgHeroId(null, categoryId);
					const stratsForHero: readonly BgsHeroStratTip[] =
						strats.heroes.find((h) => h.id === heroId)?.tips ?? [];

					return stratsForHero.map((strat) => {
						const author: BgsHeroStratAuthor = strats.authors.find((a) => a.id === strat.author);
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
							curves: strat.curves
								.map((curveId) => strats.curves?.find((c) => c.id === curveId))
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
								}),
							author: {
								name: author?.name,
								tooltip: author?.highlights,
								link: author?.link,
							},
						};
						return result;
					});
				}),
			);
	}
}

interface Strategy {
	readonly date: string;
	readonly summary: string;
	readonly curves: readonly LocalizedBgsHeroCurve[];
	readonly author: {
		readonly name: string;
		readonly tooltip: string;
		readonly link?: string;
	};
}

export interface LocalizedBgsHeroCurve extends BgsHeroCurve {
	readonly steps: readonly LocalizedBgsHeroCurveStep[];
}

export interface LocalizedBgsHeroCurveStep extends BgsHeroCurveStep {
	readonly turnLabel: string;
	readonly goldLabel: string;
	readonly localizedActions: readonly string[];
}

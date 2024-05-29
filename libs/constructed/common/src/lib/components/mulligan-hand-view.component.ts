/* eslint-disable @angular-eslint/template/no-negated-async */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';

@Component({
	selector: 'mulligan-hand-view',
	styleUrls: ['./mulligan-hand-view.component.scss'],
	template: `
		<div class="root">
			<ng-container *ngIf="showHandInfo">
				<ul class="mulligan-guide" *ngIf="cardsInHandInfo" [ngClass]="{ wide: cardsInHandInfo.length === 4 }">
					<ng-container *ngIf="showPremiumBanner === false">
						<div class="mulligan-info " *ngFor="let info of cardsInHandInfo">
							<div class="stat-container scalable" *ngIf="info.impact !== null">
								<div class="stat mulligan-keep-rate">
									<span
										class="label"
										[fsTranslate]="'decktracker.overlay.mulligan.mulligan-keep-rate'"
										[helpTooltip]="
											'decktracker.overlay.mulligan.mulligan-keep-rate-tooltip' | fsTranslate
										"
									></span>
									<span class="value" [style.color]="info.keptColor">{{ info.keepRate }}</span>
								</div>
								<div class="stat mulligan-winrate">
									<span
										class="label"
										[fsTranslate]="'decktracker.overlay.mulligan.mulligan-impact'"
										[helpTooltip]="impactWithFreeUsersHelpTooltip"
									></span>
									<span class="value" [style.color]="info.impactColor">{{ info.impact }}</span>
								</div>
							</div>
							<div class="stat mulligan-winrate no-data scalable" *ngIf="info.impact === null">
								<span
									class="label"
									[fsTranslate]="'decktracker.overlay.mulligan.no-mulligan-data'"
									[helpTooltip]="
										'decktracker.overlay.mulligan.no-mulligan-data-tooltip' | fsTranslate
									"
								></span>
							</div>
						</div>
					</ng-container>
					<ng-container *ngIf="showPremiumBanner">
						<div class="premium-container" *ngFor="let info of cardsInHandInfo">
							<ng-content></ng-content>
						</div>
					</ng-container>
				</ul>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MulliganHandViewComponent extends AbstractSubscriptionComponent {
	@Input() showHandInfo: boolean | null;
	@Input() showPremiumBanner: boolean | null;
	@Input() cardsInHandInfo: readonly InternalMulliganAdvice[] | null;
	@Input() impactWithFreeUsersHelpTooltip: string | null;

	constructor(protected override readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}
}

export interface InternalMulliganAdvice {
	readonly impact: string | null;
	readonly keepRate: string | null;
	// TODO: don't make that optional?
	readonly keptColor?: string;
	readonly impactColor?: string;
}

/* eslint-disable @angular-eslint/template/no-negated-async */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';

@Component({
	standalone: false,
	selector: 'mulligan-hand-view',
	styleUrls: ['./mulligan-hand-view.component.scss'],
	template: `
		<div class="root">
			<button
				class="close-button"
				*ngIf="showDismiss && showHandInfo"
				type="button"
				(click)="onDismiss()"
				[helpTooltip]="'decktracker.overlay.mulligan.dismiss-tooltip' | fsTranslate"
				inlineSVG="assets/svg/close.svg"
			></button>
			<div
				class="min-games-warning"
				*ngIf="personalMinGamesWarningTooltip && showHandInfo"
				inlineSVG="assets/svg/attention.svg"
				[helpTooltip]="personalMinGamesWarningTooltip"
			></div>
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
											keepRateTooltip ||
											('decktracker.overlay.mulligan.mulligan-keep-rate-tooltip' | fsTranslate)
										"
									></span>
									<span class="value" [style.color]="info.keptColor">{{ info.keepRate }}</span>
									<span
										class="value secondary"
										*ngIf="info.showBoth"
										[style.color]="info.personalKeptColor"
										>{{ info.personalKeepRate }}</span
									>
								</div>
								<div class="stat mulligan-winrate">
									<span
										class="label"
										[fsTranslate]="'decktracker.overlay.mulligan.mulligan-impact'"
										[helpTooltip]="impactWithFreeUsersHelpTooltip"
									></span>
									<span class="value" [style.color]="info.impactColor">{{ info.impact }}</span>
									<span
										class="value secondary"
										*ngIf="info.showBoth"
										[style.color]="info.personalImpactColor"
										>{{ info.personalImpact }}</span
									>
								</div>
							</div>
							<div class="stat mulligan-winrate no-data scalable" *ngIf="info.impact === null">
								<span
									class="label"
									[helpTooltip]="
										'decktracker.overlay.mulligan.no-mulligan-data-tooltip' | fsTranslate
									"
									>-</span
								>
							</div>
						</div>
					</ng-container>
					<ng-container *ngIf="showPremiumBanner">
						<div class="premium-container" *ngFor="let info of cardsInHandInfo">
							<mulligan-info-premium
								[type]="premiumType"
								[dailyFreeUses]="freeUses"
							></mulligan-info-premium>
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
	@Input() showDismiss: boolean | null;
	@Input() cardsInHandInfo: readonly InternalMulliganAdvice[] | null;
	@Input() keepRateTooltip: string | null;
	@Input() impactWithFreeUsersHelpTooltip: string | null;
	@Input() personalMinGamesWarningTooltip: string | null;
	@Input() premiumType: 'arena' | 'constructed';
	@Input() freeUses: number;
	@Input() dismiss: () => void;

	constructor(protected override readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	onDismiss() {
		this.dismiss?.();
	}
}

export interface InternalMulliganAdvice {
	readonly impact: string | null;
	readonly keepRate: string | null;
	readonly personalImpact?: string | null;
	readonly personalKeepRate?: string | null;
	readonly showBoth?: boolean;
	// TODO: don't make that optional?
	readonly keptColor?: string;
	readonly impactColor?: string;
	readonly personalKeptColor?: string;
	readonly personalImpactColor?: string;
}

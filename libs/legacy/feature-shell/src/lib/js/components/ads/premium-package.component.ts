import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { PremiumPlanId } from '../../services/premium/subscription.service';
import { PremiumPlan } from './premium-desktop.component';

@Component({
	selector: 'premium-package',
	styleUrls: [`./premium-package.component.scss`],
	template: `
		<div
			class="package {{ id }}"
			[ngClass]="{ 'read-only': isReadonly, active: isActive }"
			(click)="onSubscribe($event)"
		>
			<div class="header">
				<div class="name">{{ name }}</div>
				<div class="price">{{ price }}</div>
				<div class="periodicity">{{ periodicity }}</div>
				<div class="auto-renew" *ngIf="isAutoRenew">{{ autoRenewText }}</div>
				<div class="auto-renew" *ngIf="isActive && !isAutoRenew">{{ activeText }}</div>
				<div class="auto-renew" *ngIf="!isActive && !isAutoRenew"></div>
			</div>
			<div class="features">
				<div class="title" [fsTranslate]="'app.premium.features.title'"></div>
				<div class="feature" *ngFor="let feature of features" [ngClass]="{ disabled: !feature.enabled }">
					<div class="icon" [inlineSVG]="feature.iconPath"></div>
					<div class="text">{{ feature.text }}</div>
				</div>
			</div>
			<div class="plan-text" *ngIf="planTextKey" [fsTranslate]="planTextKey"></div>
			<button
				class="button subscribe-button"
				*ngIf="!isReadonly && !isActive"
				[fsTranslate]="subscribeButtonKey"
				[helpTooltip]="helpTooltipSubscribe"
				(click)="onSubscribe($event)"
			></button>
			<button
				class="button unsubscribe-button"
				*ngIf="isActive && isAutoRenew"
				[fsTranslate]="'app.premium.unsubscribe-button'"
				[helpTooltip]="helpTooltipUnsubscribe"
				(click)="onUnsubscribe($event)"
			></button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PremiumPackageComponent {
	@Output() subscribe = new EventEmitter<string>();
	@Output() unsubscribe = new EventEmitter<string>();

	@Input() set plan(value: PremiumPlan) {
		console.debug('setting plan', value);
		this.id = value.id.replaceAll('+', '-plus');
		this.isReadonly = value.isReadonly;
		this.isActive = value.activePlan?.id === value.id;
		const expireAtDate = value.activePlan?.expireAt ? new Date(value.activePlan.expireAt) : null;
		this.isAutoRenew == value.activePlan?.autoRenews;
		this.name = this.i18n.translateString(`app.premium.plan.${value.id}`);
		this.price = `$${value.price ?? '-'}`;
		this.periodicity = this.i18n.translateString(`app.premium.periodicity.monthly`);
		const allFeatures = ['supportFirestone', 'discordRole', 'removeAds', 'premiumFeatures', 'prioritySupport'];
		this.features = allFeatures.map((feature) => {
			const key = `app.premium.features.params.${value.features[feature] || ''}`;
			const translation = this.i18n.translateString(key);
			const featureValue = key === translation ? '' : translation;
			return {
				enabled: value.features[feature],
				iconPath: !!value.features[feature]
					? `assets/svg/premium_checkmark_active.svg`
					: `assets/svg/premium_checkmark_inactive.svg`,
				text: this.i18n
					.translateString(`app.premium.features.${feature}`, {
						value: featureValue,
					})
					.trim(),
			};
		});

		this.autoRenewText = this.i18n.translateString('app.premium.auto-renew', {
			date: expireAtDate?.toLocaleDateString(this.i18n.formatCurrentLocale()),
		});
		this.activeText = this.i18n.translateString('app.premium.active-until', {
			date: expireAtDate?.toLocaleDateString(this.i18n.formatCurrentLocale()),
		});
		this.planTextKey = value.text;
		this.subscribeButtonKey = this.buildSubscribeButtonKey(value.id, value.activePlan?.id);

		// this.helpTooltipUnsubscribe =
		// 	this.id === 'legacy'
		// 		? this.i18n.translateString(`app.premium.unsubscribe-button-tooltip-legacy`)
		// 		: this.i18n.translateString(`app.premium.unsubscribe-button-tooltip`);
	}

	isReadonly: boolean;
	isActive: boolean;
	isAutoRenew: boolean;
	id: string;
	name: string;
	autoRenewText: string;
	activeText: string;
	price: string;
	periodicity: string;
	features: readonly { enabled: boolean; iconPath: string; text: string }[];
	planTextKey: string;

	subscribeButtonKey = 'app.premium.subscribe-button';
	helpTooltipSubscribe: string;
	helpTooltipUnsubscribe: string;

	constructor(private readonly i18n: LocalizationFacadeService) {}

	onSubscribe(event: MouseEvent) {
		event.stopPropagation();
		if (this.isActive) {
			return;
		}
		console.debug('subscribing to plan', this.id);
		this.subscribe.emit(this.id);
	}

	onUnsubscribe(event: MouseEvent) {
		event.stopPropagation();
		this.unsubscribe.emit(this.id);
	}

	private buildSubscribeButtonKey(thisId: PremiumPlanId, activePlanId: PremiumPlanId): string {
		if (thisId === 'premium' && activePlanId !== 'premium+') {
			return 'app.premium.subscribe-button-upgrade';
		}
		if (thisId === 'premium+') {
			return 'app.premium.subscribe-button-epic';
		}
		return 'app.premium.subscribe-button';
	}
}

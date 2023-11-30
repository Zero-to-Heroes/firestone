import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { PremiumPlan } from './premium-desktop.component';

@Component({
	selector: 'premium-package',
	styleUrls: [`./premium-package.component.scss`],
	template: `
		<div class="package {{ id }}" [ngClass]="{ 'read-only': isReadonly, active: isActive }">
			<div class="header">
				<div class="name">{{ name }}</div>
				<div class="price">{{ price }}</div>
				<div class="periodicity">{{ periodicity }}</div>
			</div>
			<div class="features">
				<div class="title" [fsTranslate]="'app.premium.features.title'"></div>
				<div class="feature" *ngFor="let feature of features" [ngClass]="{ disabled: !feature.enabled }">
					<div class="icon" [inlineSVG]="feature.iconPath"></div>
					<div class="text">{{ feature.text }}</div>
				</div>
			</div>
			<button
				class="button subscribe-button"
				[fsTranslate]="'app.premium.subscribe-button'"
				[helpTooltip]="helpTooltipSubscribe"
			></button>
			<button
				class="button unsubscribe-button"
				[fsTranslate]="'app.premium.unsubscribe-button'"
				[helpTooltip]="helpTooltipUnsubscribe"
			></button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PremiumPackageComponent {
	@Input() set plan(value: PremiumPlan) {
		this.id = value.id.replaceAll('+', '-plus');
		this.isReadonly = value.isReadonly;
		this.isActive = value.activePlan === value.id;
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

		// this.subscribeButton = value.hasAc
		this.helpTooltipUnsubscribe =
			this.id === 'legacy'
				? this.i18n.translateString(`app.premium.unsubscribe-button-tooltip-legacy`)
				: this.i18n.translateString(`app.premium.unsubscribe-button-tooltip`);
	}

	isReadonly: boolean;
	isActive: boolean;
	id: string;
	name: string;
	price: string;
	periodicity: string;
	features: readonly { enabled: boolean; iconPath: string; text: string }[];

	subscribeButton: string;
	helpTooltipSubscribe: string;
	helpTooltipUnsubscribe: string;

	constructor(private readonly i18n: LocalizationFacadeService) {}
}

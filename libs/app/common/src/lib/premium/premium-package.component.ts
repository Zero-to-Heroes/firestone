/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { PremiumPlanId } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, sleep } from '@firestone/shared/framework/common';
import { ILocalizationService, OverwolfService, UserService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { PremiumPlan } from './premium-desktop.component';

@Component({
	standalone: false,
	selector: 'premium-package',
	styleUrls: [`./premium-package.component.scss`],
	template: `
		<div
			class="package {{ id }}"
			[ngClass]="{ 'read-only': isReadonly, active: isActive, 'cant-subscribe': cantSubscribe }"
		>
			<div class="header">
				<div class="name">{{ name }}</div>
				<div class="price">{{ price }}</div>
				<div class="periodicity">{{ periodicity }}</div>
				<div class="auto-renew" *ngIf="isActive && isAutoRenew" [innerHTML]="autoRenewText"></div>
				<div class="auto-renew" *ngIf="isActive && !isAutoRenew" [innerHTML]="cancelledText"></div>
				<div class="auto-renew" *ngIf="!isActive"></div>
			</div>
			<div class="features">
				<div class="title" [fsTranslate]="'app.premium.features.title'"></div>
				<div
					class="feature"
					*ngFor="let feature of features"
					[ngClass]="{ disabled: !feature.enabled, 'coming-soon': feature.comingSoon }"
				>
					<div class="icon" [inlineSVG]="feature.iconPath"></div>
					<div class="text">{{ feature.text }}</div>
					<div class="link" *ngIf="feature.link">(<a [href]="feature.link" target="_blank">details</a>)</div>
				</div>
			</div>
			<div class="plan-text" *ngIf="planTextKey" [fsTranslate]="planTextKey"></div>
			<!-- <div class="activate-discord" *ngIf="discordCode">
				<span class="main-text" [innerHTML]="activateDiscordText"></span>
				<span
					class="code"
					[helpTooltip]="'app.premium.activate-discord-details-copy-tooltip' | fsTranslate"
					(click)="copyDiscordCode()"
				>
					<span class="icon" inlineSVG="assets/svg/copy.svg"></span>
					<span class="text">/claim {{ discordCode }} </span>
				</span>
			</div> -->
			<div class="button-container">
				<ng-container *ngIf="loggedIn$ | async">
					<checkbox
						*ngIf="allowSubscriptionOverride"
						class="override-checkbox"
						[label]="'app.premium.override-checkbox-label' | fsTranslate"
						[value]="subOverride"
						(valueChanged)="onSubOverrideChanged($event)"
					></checkbox>
					<div
						class="confirmation-text"
						*ngIf="cantSubscribe && subOverride"
						[fsTranslate]="'app.premium.override-confirmation'"
					></div>
					<button
						class="button cant-subscribe-button"
						*ngIf="cantSubscribe && !subOverride"
						[fsTranslate]="cantSubscribeButtonKey"
						[helpTooltip]="'app.premium.cant-subscribe-tooltip' | fsTranslate"
					></button>
					<button
						class="button subscribe-button"
						*ngIf="!isReadonly && !isActive && (!cantSubscribe || subOverride)"
						[fsTranslate]="subscribeButtonKey"
						[helpTooltip]="helpTooltipSubscribe"
						(click)="onSubscribe($event)"
					></button>
					<button
						class="button unsubscribe-button"
						*ngIf="isActive && isAutoRenew && !cantSubscribe"
						[fsTranslate]="'app.premium.unsubscribe-button'"
						[helpTooltip]="helpTooltipUnsubscribe"
						(click)="onUnsubscribe($event)"
					></button>
				</ng-container>
				<ng-container *ngIf="(loggedIn$ | async) === false">
					<button
						class="button subscribe-button"
						[fsTranslate]="'app.premium.login-to-subscribe'"
						(click)="login()"
					></button>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PremiumPackageComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loggedIn$: Observable<boolean>;

	@Output() subscribe = new EventEmitter<string>();
	@Output() unsubscribe = new EventEmitter<string>();

	@Input() set plan(value: PremiumPlan) {
		this.id = value.id;
		this.isReadonly = value.isReadonly ?? false;
		this.isActive = value.activePlan?.id === value.id;
		const expireAtDate = value.activePlan?.expireAt ? new Date(value.activePlan.expireAt) : null;
		this.isAutoRenew = value.activePlan?.autoRenews ?? false;
		this.cantSubscribe = value.activePlan != null && (!this.isActive || !this.isAutoRenew);
		this.allowSubscriptionOverride =
			this.cantSubscribe &&
			value.activePlan?.id === 'legacy' &&
			value.id !== 'legacy' &&
			value.activePlan.cancelled;
		console.debug('setting plan', value, this.isActive, this.isAutoRenew);
		this.name = this.i18n.translateString(`app.premium.plan.${value.id}`);
		this.price = `$${value.price ?? '-'}`;
		this.periodicity = this.i18n.translateString(`app.premium.periodicity.monthly`);
		const allFeatures = [
			'supportFirestone',
			'removeAds',
			'premiumFeatures',
			'discordRole',
			// 'prioritySupport',
		];
		this.features = allFeatures.map((feature) => {
			const key = `app.premium.features.params.${value.features[feature] || ''}`;
			const translation = this.i18n.translateString(key);
			const featureValue = key === translation ? '' : translation;
			return {
				enabled: value.features[feature],
				// comingSoon: feature === 'discordRole',
				iconPath: !!value.features[feature]
					? `assets/svg/premium_checkmark_active.svg`
					: `assets/svg/premium_checkmark_inactive.svg`,
				text: this.i18n
					.translateString(`app.premium.features.${feature}`, {
						value: featureValue,
					})
					.trim(),
				link:
					feature === 'premiumFeatures'
						? 'https://github.com/Zero-to-Heroes/firestone/wiki/Premium-features'
						: undefined,
			};
		});

		this.autoRenewText =
			this.id === 'legacy'
				? this.i18n.translateString('app.premium.auto-renew', {
						date: expireAtDate?.toLocaleDateString(this.i18n.formatCurrentLocale()!),
				  })
				: this.i18n.translateString('app.premium.check-status-online', {
						link: `<a href="https://checkout.tebex.io/payment-history/recurring-payments" target="_blank">${this.i18n.translateString(
							'app.premium.check-status-online-link',
						)}</a>`,
				  });
		this.cancelledText =
			this.id === 'legacy'
				? this.i18n.translateString('app.premium.active-until', {
						date: expireAtDate?.toLocaleDateString(this.i18n.formatCurrentLocale()!),
				  })
				: this.i18n.translateString('app.premium.check-status-online-inactive', {
						link: `<a href="https://checkout.tebex.io/payment-history/recurring-payments" target="_blank">${this.i18n.translateString(
							'app.premium.check-status-online-link',
						)}</a>`,
				  });
		this.activeText = this.i18n.translateString('app.premium.active-until', {
			date: expireAtDate?.toLocaleDateString(this.i18n.formatCurrentLocale()!),
		});
		this.planTextKey = value.text;
		this.subscribeButtonKey = this.buildSubscribeButtonKey(value.id, value.activePlan?.id);
		if (this.isActive && this.id !== 'legacy') {
			this.activateDiscordText = this.i18n.translateString('app.premium.activate-discord-details');
		}
		this.helpTooltipSubscribe = this.cantSubscribe
			? this.i18n.translateString('app.premium.cant-subscribe-tooltip')
			: null;

		this.setComingSoonText();
		// this.helpTooltipUnsubscribe =
		// 	this.id === 'legacy'
		// 		? this.i18n.translateString(`app.premium.unsubscribe-button-tooltip-legacy`)
		// 		: this.i18n.translateString(`app.premium.unsubscribe-button-tooltip`);
	}

	isReadonly: boolean;
	isActive: boolean;
	isAutoRenew: boolean;
	cantSubscribe: boolean;
	id: string;
	name: string;
	autoRenewText: string;
	cancelledText: string;
	activeText: string;
	price: string;
	periodicity: string;
	features: readonly { enabled: boolean; iconPath: string; text: string; comingSoon?: boolean; link?: string }[];
	planTextKey: string | undefined;
	// discordCode: string;
	activateDiscordText: string;

	allowSubscriptionOverride: boolean;
	subOverride: boolean;

	cantSubscribeButtonKey = 'app.premium.cant-subscribe-button';
	subscribeButtonKey = 'app.premium.subscribe-button';
	helpTooltipSubscribe: string | null;
	helpTooltipUnsubscribe: string;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly user: UserService,
		private readonly ow: OverwolfService,
		private readonly el: ElementRef,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.user);

		this.loggedIn$ = this.user.user$$.pipe(this.mapData((user) => !!user?.username));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	// We need to wait until the CSS class has been set
	async setComingSoonText() {
		await sleep(1);
		const comingSoonElements = this.el.nativeElement.querySelectorAll('.coming-soon');
		if (!comingSoonElements?.length) {
			return;
		}
		comingSoonElements.forEach((element) => {
			element.style.setProperty(
				'--coming-soon-text',
				`"${this.i18n.translateString('app.collection.sets.coming-soon')}"`,
			);
		});
		console.debug('set style', this.el.nativeElement);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSubscribe(event: MouseEvent) {
		event.stopPropagation();
		if (this.isActive || (this.cantSubscribe && !this.subOverride)) {
			return;
		}
		console.debug('subscribing to plan', this.id);
		this.subscribe.emit(this.id);
	}

	onUnsubscribe(event: MouseEvent) {
		event.stopPropagation();
		this.unsubscribe.emit(this.id);
	}

	onSubOverrideChanged(value: boolean) {
		this.subOverride = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	login() {
		this.ow.openLoginDialog();
	}

	// copyDiscordCode() {
	// 	this.ow.placeOnClipboard(`/claim ${this.discordCode}`);
	// }

	private buildSubscribeButtonKey(thisId: PremiumPlanId, activePlanId: PremiumPlanId | undefined): string {
		if (thisId === 'premium' && activePlanId != null) {
			return 'app.premium.subscribe-button-upgrade';
		}
		return 'app.premium.subscribe-button';
	}
}

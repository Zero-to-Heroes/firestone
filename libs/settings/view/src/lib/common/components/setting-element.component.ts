import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { Setting } from '@firestone/settings/services';
import {
	FeatureSpotlightsService,
	getFeatureSpotlightMediaType,
	PreferencesService,
	resolveSpotlightMediaFile,
} from '@firestone/shared/common/service';
import { SpotlightMediaLightboxService } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, filter, Observable } from 'rxjs';

const SPOTLIGHT_TOOLTIP_DWELL_MS = 1500;

@Component({
	standalone: false,
	selector: 'setting-element',
	styleUrls: [`../../settings-common.component.scss`, `./setting-element.component.scss`],
	template: `
		<div class="setting-row">
			<div class="setting-body">
				<ng-container [ngSwitch]="_setting.type">
					<preference-toggle
						*ngSwitchCase="'toggle'"
						[ngClass]="{ disabled: disabled, indented: _setting.indented }"
						[field]="_setting.field"
						[label]="_setting.label"
						[tooltip]="_setting.tooltip"
						[advancedSetting]="_setting.advancedSetting"
						premiumSetting
						[premiumSettingEnabled]="_setting.premiumSetting"
						[messageWhenToggleValue]="_setting.toggleConfig?.messageWhenToggleValue"
						[valueToDisplayMessageOn]="_setting.toggleConfig?.valueToDisplayMessageOn"
						[toggleFunction]="_setting.toggleConfig?.toggleFunction"
					></preference-toggle>
					<preference-ynlimited
						*ngSwitchCase="'toggle-ynlimited'"
						class="toggle"
						[field]="_setting.field"
						[label]="_setting.label"
						[tooltip]="_setting.tooltip"
					></preference-ynlimited>
					<preferences-dropdown
						*ngSwitchCase="'dropdown'"
						[ngClass]="{ disabled: disabled }"
						[options]="_setting.dropdownConfig!.options"
						[field]="_setting.field"
						[label]="_setting.label"
						[tooltip]="_setting.tooltip"
						[afterSelection]="_setting.dropdownConfig!.afterSelection"
						[advancedSetting]="_setting.advancedSetting"
						premiumSetting
						[premiumSettingEnabled]="_setting.premiumSetting"
					></preferences-dropdown>
					<preference-numeric-input
						*ngSwitchCase="'numeric-input'"
						[ngClass]="{ disabled: disabled }"
						[field]="_setting.field"
						[label]="_setting.label"
						[tooltip]="_setting.tooltip"
						[minValue]="_setting.numericConfig!.minValue"
						[incrementStep]="_setting.numericConfig!.incrementStep"
					></preference-numeric-input>
					<div class="slider-container" *ngSwitchCase="'slider'">
						<div class="label">
							<div class="setting-text" [innerHTML]="_setting.label"></div>
							<i class="setting-info" *ngIf="_setting.tooltip" [helpTooltip]="_setting.tooltip">
								<svg>
									<use xlink:href="assets/svg/sprite.svg#info" />
								</svg>
							</i>
						</div>
						<preference-slider
							class="slider"
							[field]="_setting.field"
							[enabled]="!disabled"
							[min]="_setting.sliderConfig!.min!"
							[max]="_setting.sliderConfig!.max!"
							[snapSensitivity]="_setting.sliderConfig!.snapSensitivity"
							[knobs]="_setting.sliderConfig!.knobs"
							[showCurrentValue]="_setting.sliderConfig!.showCurrentValue"
							[displayedValueUnit]="_setting.sliderConfig!.displayedValueUnit ?? ''"
						>
						</preference-slider>
					</div>
				</ng-container>
			</div>
			<button
				class="spotlight-preview"
				*ngIf="activeSpotlight$ | async as spotlight"
				type="button"
				[hidden]="spotlight.mediaFailed"
				[helpTooltip]="'settings.global.view-screenshot' | fsTranslate"
				(click)="openSpotlightMedia(spotlight)"
			>
				<img
					class="media-preload"
					*ngIf="spotlight.mediaType === 'image'"
					[src]="spotlight.mediaUrl"
					alt=""
					(error)="onMediaError(spotlight)"
				/>
				<video
					class="media-preload"
					*ngIf="spotlight.mediaType === 'video'"
					[src]="spotlight.mediaUrl"
					(error)="onMediaError(spotlight)"
				></video>
				<svg class="preview-icon" viewBox="0 0 16 16" aria-hidden="true">
					<rect
						x="1.2"
						y="2.2"
						width="13.6"
						height="11.6"
						rx="1.2"
						fill="none"
						stroke="currentColor"
						stroke-width="1.2"
					/>
					<circle cx="5.2" cy="6.2" r="1.15" fill="currentColor" />
					<path
						d="M2 12.2 L5.8 8.2 L8.4 10.8 L10.6 8.6 L14 12.2"
						fill="none"
						stroke="currentColor"
						stroke-width="1.2"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			<button
				class="new-badge"
				*ngIf="unseenSpotlight$ | async as spotlight"
				type="button"
				[helpTooltip]="spotlight.tooltip"
				[helpTooltipWidth]="280"
				(mouseenter)="onBadgeEnter()"
				(mouseleave)="onBadgeLeave(spotlight.id)"
				(click)="onBadgeClick(spotlight.id)"
			>
				{{ 'settings.global.new-badge' | fsTranslate }}
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingElementComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	@Input() set setting(value: Setting) {
		this._setting = value;
		this.setting$$.next(value);
	}

	_setting: Setting;
	disabled: boolean | undefined;
	unseenSpotlight$: Observable<{ id: string; tooltip: string } | null>;
	activeSpotlight$: Observable<SpotlightMediaView | null>;

	private setting$$ = new BehaviorSubject<Setting | null>(null);
	private badgeHoverTimer: ReturnType<typeof setTimeout> | null = null;
	private badgeHoverLongEnough = false;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly spotlights: FeatureSpotlightsService,
		private readonly lightbox: SpotlightMediaLightboxService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.ads, this.spotlights);

		combineLatest([this.setting$$, this.prefs.preferences$$, this.ads.hasPremiumSub$$])
			.pipe(
				filter(([setting, prefs, premium]) => !!setting && !!prefs),
				this.mapData(([setting, prefs, premium]) => setting?.disabledIf?.(prefs, premium)),
			)
			.subscribe((disabled) => {
				this.disabled = disabled;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.markForCheck();
				}
			});

		this.unseenSpotlight$ = combineLatest([
			this.setting$$,
			this.spotlights.activeSpotlights$$,
			this.prefs.preferences$$,
		]).pipe(
			this.mapData(([setting, active, prefs]) => {
				const spotlight = this.spotlights.findForPrefField(setting?.field);
				if (!spotlight || !active.some((s) => s.id === spotlight.id)) {
					return null;
				}
				if ((prefs?.seenSpotlightIds ?? []).includes(spotlight.id)) {
					return null;
				}
				return { id: spotlight.id, tooltip: this.spotlights.buildTooltipHtml(spotlight) };
			}),
		);

		this.activeSpotlight$ = combineLatest([this.setting$$, this.spotlights.activeSpotlights$$]).pipe(
			this.mapData(([setting, active]) => {
				const spotlight = this.spotlights.findForPrefField(setting?.field);
				if (!spotlight || !active.some((s) => s.id === spotlight.id)) {
					return null;
				}
				const media = resolveSpotlightMediaFile(spotlight);
				return {
					id: spotlight.id,
					mediaUrl: this.spotlights.getMediaUrl(media),
					mediaType: getFeatureSpotlightMediaType(media),
					mediaFailed: false,
				};
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	override ngOnDestroy() {
		this.clearBadgeHoverTimer();
		super.ngOnDestroy();
	}

	onBadgeEnter() {
		this.clearBadgeHoverTimer();
		this.badgeHoverLongEnough = false;
		this.badgeHoverTimer = setTimeout(() => {
			this.badgeHoverLongEnough = true;
			this.badgeHoverTimer = null;
		}, SPOTLIGHT_TOOLTIP_DWELL_MS);
	}

	async onBadgeLeave(id: string) {
		this.clearBadgeHoverTimer();
		if (!this.badgeHoverLongEnough) {
			return;
		}
		this.badgeHoverLongEnough = false;
		await this.spotlights.acknowledge(id);
	}

	async onBadgeClick(id: string) {
		this.clearBadgeHoverTimer();
		this.badgeHoverLongEnough = false;
		await this.openSpotlightById(id);
	}

	async openSpotlightMedia(spotlight: SpotlightMediaView) {
		if (spotlight.mediaFailed || !spotlight.mediaUrl) {
			return;
		}
		this.lightbox.open({ url: spotlight.mediaUrl, mediaType: spotlight.mediaType });
		await this.spotlights.acknowledge(spotlight.id);
	}

	onMediaError(spotlight: SpotlightMediaView) {
		spotlight.mediaFailed = true;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	private async openSpotlightById(id: string) {
		const spotlight = this.spotlights.getActive().find((item) => item.id === id);
		if (spotlight) {
			const media = resolveSpotlightMediaFile(spotlight);
			this.lightbox.open({
				url: this.spotlights.getMediaUrl(media),
				mediaType: getFeatureSpotlightMediaType(media),
			});
		}
		await this.spotlights.acknowledge(id);
	}

	private clearBadgeHoverTimer() {
		if (this.badgeHoverTimer) {
			clearTimeout(this.badgeHoverTimer);
			this.badgeHoverTimer = null;
		}
	}
}

interface SpotlightMediaView {
	readonly id: string;
	readonly mediaUrl: string;
	readonly mediaType: 'image' | 'video';
	mediaFailed: boolean;
}

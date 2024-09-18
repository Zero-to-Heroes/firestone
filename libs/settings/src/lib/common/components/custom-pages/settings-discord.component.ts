import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { AnalyticsService, ILocalizationService } from '@firestone/shared/framework/core';
import { Observable, take, takeUntil } from 'rxjs';

@Component({
	selector: 'settings-discord',
	styleUrls: [`../../../settings-common.component.scss`, `./settings-discord.component.scss`],
	template: `
		<div class="settings-group">
			<preference-toggle
				field="discordRichPresence"
				[label]="'settings.general.discord.discord-presence-label' | fsTranslate"
				[tooltip]="'settings.general.discord.discord-presence-tooltip' | fsTranslate"
				[toggleFunction]="afterRichPresenceChanged"
			></preference-toggle>
		</div>
		<div class="settings-group" [ngClass]="{ disabled: discordDisabled$ | async }">
			<div class="subgroup">
				<preference-toggle
					class="toggle"
					field="discordRpcEnableCustomInGameText"
					[label]="'settings.general.discord.activate-custom-in-game-text-label' | fsTranslate"
					[tooltip]="'settings.general.discord.activate-custom-in-game-text-tooltip' | fsTranslate"
				></preference-toggle>
				<div class="custom-text-config" [ngClass]="{ disabled: discordRpcDisableCustomInGameText$ | async }">
					<fs-text-input
						class="custom-text-input"
						[showSearchIcon]="false"
						[value]="customInput$ | async"
						[placeholder]="customInGameTextPlaceholder"
						[debounceTime]="500"
						(fsModelUpdate)="onCustomGameStringUpdated($event)"
					>
					</fs-text-input>
				</div>
			</div>
		</div>
		<!-- Premium config -->
		<div class="settings-group" [ngClass]="{ disabled: discordDisabled$ | async }" premiumSetting>
			<div class="title">
				<div class="premium-lock" [helpTooltip]="'settings.global.locked-tooltip' | fsTranslate">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#lock" />
					</svg>
				</div>
				<span class="title-text" [fsTranslate]="'settings.general.discord.advanced-config-title'"></span>
			</div>

			<div class="subgroup">
				<preference-toggle
					class="toggle"
					field="discordRpcEnableCustomInMatchText"
					[label]="'settings.general.discord.activate-custom-in-match-text-label' | fsTranslate"
					[tooltip]="'settings.general.discord.activate-custom-in-match-text-tooltip' | fsTranslate"
				></preference-toggle>
				<div class="custom-text-config" [ngClass]="{ disabled: discordRpcDisableCustomInMatchText$ | async }">
					<div class="details">
						<div class="details-text" [fsTranslate]="'settings.general.discord.in-game-details.text'"></div>
						<ul class="tokens">
							<li
								class="token"
								[helpTooltip]="'settings.general.discord.in-game-details.tokens.mode' | fsTranslate"
							>
								&#123;mode&#125;
							</li>
							<li
								class="token"
								[helpTooltip]="'settings.general.discord.in-game-details.tokens.hero' | fsTranslate"
							>
								&#123;hero&#125;
							</li>
						</ul>
						<div class="details-text details-text-2" [innerHTML]="text2"></div>
					</div>
					<fs-text-input
						class="custom-text-input"
						[showSearchIcon]="false"
						[value]="customMatchInput$ | async"
						[placeholder]="customInMatchTextPlaceholder"
						[debounceTime]="500"
						(fsModelUpdate)="onCustomMatchStringUpdated($event)"
					>
					</fs-text-input>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDiscordComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	discordDisabled$: Observable<boolean>;
	discordRpcDisableCustomInGameText$: Observable<boolean>;
	discordRpcDisableCustomInMatchText$: Observable<boolean>;
	customInput$: Observable<string>;
	customMatchInput$: Observable<string>;

	customInGameTextPlaceholder: string;
	customInMatchTextPlaceholder: string;

	text2 = this.i18n.translateString('settings.general.discord.in-game-details.text-2', {
		discordLink: `<a href="https://discord.gg/vKeB3gnKTy" target="_blank">Discord</a>`,
	});

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
		private readonly analytics: AnalyticsService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.discordDisabled$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.discordRichPresence));
		this.discordRpcDisableCustomInGameText$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.discordRpcEnableCustomInGameText),
		);
		this.discordRpcDisableCustomInMatchText$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.discordRpcEnableCustomInMatchText),
		);
		this.customInput$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.discordRpcCustomInGameText),
			take(1),
			takeUntil(this.destroyed$),
		);
		this.customMatchInput$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.discordRpcCustomInMatchText),
			take(1),
			takeUntil(this.destroyed$),
		);

		this.customInGameTextPlaceholder = this.i18n.translateString(
			'settings.general.discord.in-game-text-default-value',
		);
		this.customInMatchTextPlaceholder = this.i18n.translateString(
			'settings.general.discord.in-game-text-in-match-default-value',
		);
	}

	async onCustomGameStringUpdated(value: string) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			discordRpcCustomInGameText: value,
		};
		console.debug('updating prefs', newPrefs, value);
		await this.prefs.savePreferences(newPrefs);
		this.analytics.trackEvent('discord', {
			feature: 'change-custom-in-game-text',
		});
	}

	async onCustomMatchStringUpdated(value: string) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			discordRpcCustomInMatchText: value,
		};
		console.debug('updating prefs', newPrefs, value);
		await this.prefs.savePreferences(newPrefs);
		this.analytics.trackEvent('discord', {
			feature: 'change-custom-in-match-text',
		});
	}

	afterRichPresenceChanged = (newValue: boolean) => {
		this.analytics.trackEvent('discord', {
			enabled: newValue,
		});
	};
}

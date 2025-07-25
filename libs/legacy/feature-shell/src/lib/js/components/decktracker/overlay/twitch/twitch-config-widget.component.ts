import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import {
	AbstractSubscriptionTwitchComponent,
	TwitchPreferences,
	TwitchPreferencesService,
} from '@firestone/twitch/common';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { Observable, from } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DropdownOption } from '../../../settings/dropdown.component';

@Component({
	standalone: false,
	selector: 'twitch-config-widget',
	styleUrls: [
		// `../../../../../css/themes/battlegrounds-theme.scss`,
		`../../../../../css/global/scrollbar-decktracker-overlay.scss`,
		'./twitch-config-widget.component.scss',
	],
	template: `
		<!-- Don't add scalable class so that the root element itself is scaled -->
		<div class="twitch-config-widget">
			<div class="settings" *ngIf="prefs$ | async as prefs">
				<dropdown
					class="item"
					[options]="languageOptions"
					[label]="'twitch.language' | owTranslate"
					[disabled]="!prefs.showBattleSimulator"
					[value]="prefs.locale"
					(valueChanged)="onLocaleChanged(prefs, $event)"
				>
				</dropdown>
				<checkbox
					class="item"
					[label]="'twitch.adaptative-scaling' | owTranslate"
					[labelTooltip]="'twitch.adaptative-scaling-tooltip' | owTranslate"
					[value]="prefs.adaptativeScaling"
					(valueChanged)="onAdaptativeScalingChanged(prefs, $event)"
				></checkbox>
				<numeric-input
					class="item input scale"
					[label]="'twitch.scale' | owTranslate"
					[labelTooltip]="'twitch.scale-tooltip' | owTranslate"
					[value]="prefs.scale"
					[minValue]="40"
					[incrementStep]="5"
					(valueChange)="onScaleChanged(prefs, $event)"
				></numeric-input>
				<numeric-input
					class="item input scale"
					[label]="'twitch.card-scale' | owTranslate"
					[labelTooltip]="'twitch.card-scale-tooltip' | owTranslate"
					[value]="prefs.cardScale"
					[minValue]="40"
					[incrementStep]="5"
					(valueChange)="onCardScaleChanged(prefs, $event)"
				></numeric-input>
				<section class="constructed">
					<div class="section-title" [owTranslate]="'twitch.constructed-section-title'"></div>
					<div class="group">
						<checkbox
							class="item"
							[label]="'twitch.show-tracker' | owTranslate"
							[value]="prefs.decktrackerOpen"
							(valueChanged)="onShowDecktrackerChanged(prefs, $event)"
						></checkbox>
						<checkbox
							class="item"
							[label]="'settings.decktracker.opponent-deck.group-cards-by-zone-label' | owTranslate"
							[labelTooltip]="
								'settings.decktracker.opponent-deck.group-cards-by-zone-tooltip' | owTranslate
							"
							[value]="prefs.useModernTracker"
							(valueChanged)="onUseModernTrackerChanged(prefs, $event)"
						></checkbox>
						<checkbox
							class="item"
							[label]="'twitch.show-related-cards-help' | owTranslate"
							[labelTooltip]="'twitch.show-related-cards-help-tooltip' | owTranslate"
							[value]="prefs.showRelatedCards"
							(valueChanged)="onShowRelatedCardsChanged(prefs, $event)"
						></checkbox>
						<checkbox
							class="item"
							[label]="'settings.decktracker.global.highlight-related-cards' | owTranslate"
							[labelTooltip]="'settings.decktracker.global.highlight-related-cards-tooltip' | owTranslate"
							[value]="prefs.overlayHighlightRelatedCards"
							(valueChanged)="onHighlightRelatedCardsChanged(prefs, $event)"
						></checkbox>
						<checkbox
							class="item"
							[label]="'settings.decktracker.global.show-rarity-color' | owTranslate"
							[labelTooltip]="'settings.decktracker.global.show-rarity-color-tooltip' | owTranslate"
							[value]="prefs.decktrackerColorManaCost"
							(valueChanged)="onDecktrackerColorManaCostChanged(prefs, $event)"
						></checkbox>
						<checkbox
							class="item"
							[label]="'twitch.show-opponent-tracker' | owTranslate"
							[value]="prefs.decktrackerShowOpponentTracker"
							(valueChanged)="onDecktrackerShowOpponentTrackerChanged(prefs, $event)"
						></checkbox>
					</div>
				</section>
				<section class="battlegrounds">
					<div class="section-title" [owTranslate]="'twitch.battlegrounds-section-title'"></div>
					<div class="group">
						<checkbox
							class="item"
							[label]="'twitch.show-hero-cards-help' | owTranslate"
							[labelTooltip]="'twitch.show-hero-cards-help-tooltip' | owTranslate"
							[value]="prefs.showHeroCards"
							(valueChanged)="onShowHeroCardsChanged(prefs, $event)"
						></checkbox>
						<checkbox
							class="item"
							[label]="'twitch.move-magnifier-icon-on-top' | owTranslate"
							[labelTooltip]="'twitch.move-magnifier-icon-on-top-tooltip' | owTranslate"
							[value]="prefs.magnifierIconOnTop"
							(valueChanged)="onMagnifierIconOnTopChanged(prefs, $event)"
						></checkbox>
					</div>
					<div class="group">
						<checkbox
							class="item"
							[label]="'twitch.show-minions-list' | owTranslate"
							[labelTooltip]="'twitch.show-minions-list-tooltip' | owTranslate"
							[value]="prefs.showMinionsList"
							(valueChanged)="onShowMinionsListChanged(prefs, $event)"
						></checkbox>
						<checkbox
							class="item indented"
							[label]="'twitch.show-minions-list-golden-cards' | owTranslate"
							[labelTooltip]="'twitch.show-minions-list-golden-cards-tooltip' | owTranslate"
							[disabled]="!prefs.showMinionsList"
							[value]="prefs.showMinionsListGoldenCards"
							(valueChanged)="onShowMinionsListGoldenCardsChanged(prefs, $event)"
						></checkbox>
						<checkbox
							class="item indented"
							[label]="
								'settings.battlegrounds.overlay.minions-list-show-mechanics-tiers-label' | owTranslate
							"
							[labelTooltip]="
								'settings.battlegrounds.overlay.minions-list-show-mechanics-tiers-tooltip' | owTranslate
							"
							[disabled]="!prefs.showMinionsList"
							[value]="prefs.bgsShowMechanicsTiers"
							(valueChanged)="onShowMechanisTiersChanged(prefs, $event)"
						></checkbox>
						<checkbox
							class="item indented"
							[label]="'settings.battlegrounds.overlay.minions-list-show-tribe-tiers-label' | owTranslate"
							[labelTooltip]="
								'settings.battlegrounds.overlay.minions-list-show-tribe-tiers-tooltip' | owTranslate
							"
							[disabled]="!prefs.showMinionsList"
							[value]="prefs.bgsShowTribeTiers"
							(valueChanged)="onShowTribeTiersChanged(prefs, $event)"
						></checkbox>
						<checkbox
							class="item indented"
							[label]="'settings.battlegrounds.overlay.minions-list-show-tier-7-label' | owTranslate"
							[labelTooltip]="
								'settings.battlegrounds.overlay.minions-list-show-tier-7-tooltip' | owTranslate
							"
							[disabled]="!prefs.showMinionsList"
							[value]="prefs.bgsShowTierSeven"
							(valueChanged)="onShowTier7Changed(prefs, $event)"
						></checkbox>
						<checkbox
							class="item indented"
							[label]="'settings.battlegrounds.overlay.minions-list-show-trinkets-label' | owTranslate"
							[labelTooltip]="
								'settings.battlegrounds.overlay.minions-list-show-trinkets-tooltip' | owTranslate
							"
							[disabled]="!prefs.showMinionsList"
							[value]="prefs.bgsShowTrinkets"
							(valueChanged)="onShowTrinketsChanged(prefs, $event)"
						></checkbox>
						<checkbox
							class="item indented"
							[label]="
								'settings.battlegrounds.overlay.minions-list-group-minions-into-tribes-label'
									| owTranslate
							"
							[labelTooltip]="
								'settings.battlegrounds.overlay.minions-list-group-minions-into-tribes-tooltip'
									| owTranslate
							"
							[disabled]="!prefs.showMinionsList"
							[value]="prefs.bgsGroupMinionsIntoTheirTribeGroup"
							(valueChanged)="onGroupMinionsIntoTheirTribesChanged(prefs, $event)"
						></checkbox>
					</div>
					<div class="group">
						<checkbox
							class="item"
							[label]="'twitch.show-battle-simulator' | owTranslate"
							[value]="prefs.showBattleSimulator"
							(valueChanged)="onShowBattleSimulatorChanged(prefs, $event)"
						></checkbox>
						<dropdown
							class="item indented"
							[options]="autoTrueFalseOptions"
							[label]="'twitch.hide-battle-odds-in-combat' | owTranslate"
							[labelTooltip]="'twitch.hide-battle-odds-in-combat-tooltip' | owTranslate"
							[disabled]="!prefs.showBattleSimulator"
							[value]="prefs.hideBattleOddsInCombat"
							(valueChanged)="onHideBattleOddsInCombatChanged(prefs, $event)"
						>
						</dropdown>
						<dropdown
							class="item indented"
							[options]="autoTrueFalseOptions"
							[label]="'twitch.hide-battle-odds-in-tavern' | owTranslate"
							[labelTooltip]="'twitch.hide-battle-odds-in-tavern-tooltip' | owTranslate"
							[disabled]="!prefs.showBattleSimulator"
							[value]="prefs.hideBattleOddsInTavern"
							(valueChanged)="onHideBattleOddsInTavernChanged(prefs, $event)"
						></dropdown>
						<checkbox
							class="item indented"
							[label]="'twitch.hide-battle-odds-when-empty' | owTranslate"
							[labelTooltip]="'twitch.hide-battle-odds-when-empty-tooltip' | owTranslate"
							[disabled]="!prefs.showBattleSimulator"
							[value]="prefs.hideBattleOddsWhenEmpty"
							(valueChanged)="onHideBattleOddsWhenEmptyChanged(prefs, $event)"
						></checkbox>
					</div>
				</section>
			</div>
			<div class="side-text">
				<div class="text" [owTranslate]="'twitch.settings-side-text'"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitchConfigWidgetComponent extends AbstractSubscriptionTwitchComponent implements AfterContentInit {
	prefs$: Observable<TwitchPreferences>;

	autoTrueFalseOptions: DropdownOption[] = [
		{
			value: null,
			label: this.i18n.translateString('twitch.options.auto'),
			tooltip: this.i18n.translateString('twitch.options.auto-tooltip'),
		},
		{
			value: 'true',
			label: this.i18n.translateString('twitch.options.true'),
		},
		{
			value: 'false',
			label: this.i18n.translateString('twitch.options.false'),
		},
	];

	languageOptions: DropdownOption[] = [
		{
			value: 'auto',
			label: this.i18n.translateString('twitch.language-auto'),
			tooltip: this.i18n.translateString('twitch.language-auto-tooltip'),
		},
		{
			value: 'deDE',
			label: 'Deutsch',
		},
		{
			value: 'enUS',
			label: 'English',
		},
		{
			value: 'esES',
			label: 'Espa\u00f1ol (EU)',
		},
		{
			value: 'esMX',
			label: 'Espa\u00f1ol (AL)',
		},
		{
			value: 'frFR',
			label: 'Fran\u00e7ais',
		},
		{
			value: 'itIT',
			label: 'Italiano',
		},
		{
			value: 'jaJP',
			label: '\u65e5\u672c\u8a9e',
		},
		{
			value: 'koKR',
			label: '\ud55c\uad6d\uc5b4',
		},
		{
			value: 'plPL',
			label: 'Polski',
		},
		{
			value: 'ptBR',
			label: 'Portugu\u00eas (BR)',
		},
		{
			value: 'ruRU',
			label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439',
		},
		{
			value: 'thTH',
			label: '\u0e44\u0e17\u0e22',
		},
		{
			value: 'zhCN',
			label: '\u7b80\u4f53\u4e2d\u6587',
		},
		{
			value: 'zhTW',
			label: '\u7e41\u9ad4\u4e2d\u6587',
		},
	];

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		protected readonly prefs: TwitchPreferencesService,
		protected readonly el: ElementRef,
		protected readonly renderer: Renderer2,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(cdr);
		// super.minScale = 0.7;
	}

	ngAfterContentInit(): void {
		// super.listenForResize();
		this.prefs$ = from(this.prefs.prefs.asObservable()).pipe(debounceTime(200), distinctUntilChanged());
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	onLocaleChanged(prefs: TwitchPreferences, value: string) {
		const newPrefs: TwitchPreferences = { ...prefs, locale: value };
		console.log('changing locale pref', newPrefs);
		this.prefs.savePrefs(newPrefs);

		const queryLanguage =
			newPrefs.locale === 'auto' ? new URLSearchParams(window.location.search).get('language') : newPrefs.locale;
		const locale = mapTwitchLanguageToHsLocale(queryLanguage);
		console.debug('will set locale', locale);
		this.i18n.setLocale(locale);
	}

	onAdaptativeScalingChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, adaptativeScaling: value };
		console.log('changing adaptativeScaling pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onScaleChanged(prefs: TwitchPreferences, value: number) {
		const newPrefs: TwitchPreferences = { ...prefs, scale: value };
		console.log('changing scale pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onCardScaleChanged(prefs: TwitchPreferences, value: number) {
		const newPrefs: TwitchPreferences = { ...prefs, cardScale: value };
		console.log('changing scale pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowHeroCardsChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showHeroCards: value };
		console.log('changing showHeroCards pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowDecktrackerChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, decktrackerOpen: value };
		console.log('changing decktrackerOpen pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onUseModernTrackerChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, useModernTracker: value };
		console.log('changing useModernTracker pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowRelatedCardsChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showRelatedCards: value };
		console.log('changing showRelatedCards pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onHighlightRelatedCardsChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, overlayHighlightRelatedCards: value };
		console.log('changing overlayHighlightRelatedCards pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onDecktrackerColorManaCostChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, decktrackerColorManaCost: value };
		console.log('changing decktrackerColorManaCost pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onDecktrackerShowOpponentTrackerChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, decktrackerShowOpponentTracker: value };
		console.log('changing decktrackerShowOpponentTracker pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onMagnifierIconOnTopChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, magnifierIconOnTop: value };
		console.log('changing magnifierIconOnTop pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowMinionsListChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showMinionsList: value };
		console.log('changing showMinionsList pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowMinionsListGoldenCardsChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showMinionsListGoldenCards: value };
		console.log('changing showMinionsListGoldenCards pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowMechanisTiersChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, bgsShowMechanicsTiers: value };
		console.log('changing bgsShowMechanicsTiers pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowTribeTiersChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, bgsShowTribeTiers: value };
		console.log('changing bgsShowTribeTiers pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowTier7Changed(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, bgsShowTierSeven: value };
		console.log('changing bgsShowTierSeven pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowTrinketsChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, bgsShowTrinkets: value };
		console.log('changing bgsShowTrinkets pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onGroupMinionsIntoTheirTribesChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, bgsGroupMinionsIntoTheirTribeGroup: value };
		console.log('changing bgsGroupMinionsIntoTheirTribeGroup pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowBattleSimulatorChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showBattleSimulator: value };
		console.log('changing showBattleSimulator pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onHideBattleOddsInCombatChanged(prefs: TwitchPreferences, value: any) {
		const newPrefs: TwitchPreferences = { ...prefs, hideBattleOddsInCombat: value as 'auto' | 'true' | 'false' };
		console.log('changing hideBattleOddsInCombat pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onHideBattleOddsInTavernChanged(prefs: TwitchPreferences, value: any) {
		const newPrefs: TwitchPreferences = { ...prefs, hideBattleOddsInTavern: value as 'auto' | 'true' | 'false' };
		console.log('changing hideBattleOddsInTavern pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onHideBattleOddsWhenEmptyChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, hideBattleOddsWhenEmpty: value };
		console.log('changing hideBattleOddsWhenEmpty pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}
}

export const mapTwitchLanguageToHsLocale = (twitchLanguage: string): string => {
	const mapping = {
		de: 'deDE',
		en: 'enUS',
		'en-gb': 'enUS',
		es: 'esES',
		'es-mx': 'esMX',
		fr: 'frFR',
		it: 'itIT',
		ja: 'jaJP',
		ko: 'koKR',
		pl: 'plPL',
		pt: 'ptBR',
		'pt-br': 'ptBR',
		ru: 'ruRU',
		th: 'thTH',
		'zh-cn': 'zhCN',
		'zh-tw': 'zhTW',
	};
	if (Object.values(mapping).indexOf(twitchLanguage) !== -1) {
		return twitchLanguage;
	}
	const hsLocale = mapping[twitchLanguage] ?? 'enUS';
	return hsLocale;
};

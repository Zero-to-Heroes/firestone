import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { TwitchPreferences } from '@components/decktracker/overlay/twitch/twitch-preferences';
import { TwitchPreferencesService } from '@components/decktracker/overlay/twitch/twitch-preferences.service';
import { from, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
	selector: 'twitch-config-widget',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../../css/component/decktracker/overlay/twitch/twitch-config-widget.component.scss',
	],
	template: `
		<div class="twitch-config-widget">
			<div class="settings" *ngIf="prefs$ | async as prefs">
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
				<section class="constructed">
					<div class="section-title" [owTranslate]="'twitch.constructed-section-title'"></div>
					<div class="group">
						<checkbox
							class="item"
							[label]="'twitch.show-related-cards-help' | owTranslate"
							[labelTooltip]="'twitch.show-related-cards-help-tooltip' | owTranslate"
							[value]="prefs.showRelatedCards"
							(valueChanged)="onShowRelatedCardsChanged(prefs, $event)"
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
					</div>
					<div class="group">
						<checkbox
							class="item"
							[label]="'twitch.show-battle-simulator' | owTranslate"
							[value]="prefs.showBattleSimulator"
							(valueChanged)="onShowBattleSimulatorChanged(prefs, $event)"
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
export class TwitchConfigWidgetComponent implements AfterContentInit {
	prefs$: Observable<TwitchPreferences>;

	constructor(private readonly prefs: TwitchPreferencesService, private readonly cdr: ChangeDetectorRef) {}

	async ngAfterContentInit() {
		this.prefs$ = from(this.prefs.prefs.asObservable()).pipe(debounceTime(200), distinctUntilChanged());
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
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

	onShowHeroCardsChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showHeroCards: value };
		console.log('changing showHeroCards pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowRelatedCardsChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showRelatedCards: value };
		console.log('changing showRelatedCards pref', newPrefs);
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

	onShowBattleSimulatorChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showBattleSimulator: value };
		console.log('changing showBattleSimulator pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}
}

import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { Knob } from '@firestone/shared/common/view';
import {
	AnalyticsService,
	DiskCacheService,
	IAdsService,
	ILocalizationService,
	OverwolfService,
} from '@firestone/shared/framework/core';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { Observable } from 'rxjs';

export interface SettingContext {
	readonly prefs: PreferencesService;
	readonly analytics: AnalyticsService;
	readonly ow: OverwolfService;
	readonly i18n: ILocalizationService;
	readonly adService: IAdsService;
	readonly services: {
		readonly diskCache: DiskCacheService;
		readonly gamesLoader: GameStatsLoaderService;
	};
}

export interface SettingNode {
	readonly id: string;
	readonly name: string;
	readonly cssClass?: string;
	readonly keywords: readonly string[] | null;
	readonly children: readonly SettingNode[] | null;
	readonly sections?: readonly (Section | SectionReference)[];
}

// Not sure how to do this, but the idea is to simply specify a manually crafted component that we insert
export interface SectionReference {
	readonly componentType: SettingsSectionReferenceType;
}
export type SettingsSectionReferenceType =
	| 'AppearanceCustomizationPageComponent'
	| 'SettingsGeneralBugReportComponent'
	| 'SettingsGeneralThirdPartyComponent'
	| 'SettingsDiscordComponent'
	| 'SettingsBroadcastComponent';

export interface Section {
	readonly id: string;
	readonly title: string | null;
	readonly texts?: readonly (string | Observable<string>)[]; // Raw HTML
	readonly settings?: readonly (Setting | SettingButton)[];
	readonly disabled$?: () => Observable<boolean>;
	// TODO: how to handle the buttons that let you reset the widget positions?
	readonly buttons?: readonly SettingButton[];
	// need text, tooltip, action, confirmation
}

export interface SettingButton {
	readonly label?: string;
	readonly text: string | Observable<string>;
	readonly tooltip: string | null;
	readonly action: () => void | PromiseLike<void>;
	readonly confirmation?: string;
}

export interface Setting {
	readonly type: 'toggle' | 'dropdown' | 'slider' | 'text-input';
	readonly field: keyof Preferences;
	readonly label: string | null;
	readonly tooltip: string | null;
	// E.g. if a setting can only be activated when the parent is on, and we want to display them as indented below them
	// readonly childSettings?: readonly Setting[];
	readonly disabledIf?: (prefs: Preferences) => boolean;
	readonly keywords?: readonly string[] | null;
	readonly advancedSetting?: boolean;
	readonly premiumSetting?: boolean;

	readonly toggleConfig?: ToggleConfig;
	readonly dropdownConfig?: DropdownConfig;
	readonly sliderConfig?: SliderConfig;
	readonly textInputConfig?: TextInputConfig;
}

export interface ToggleConfig {
	readonly messageWhenToggleValue?: string;
	readonly valueToDisplayMessageOn?: string | boolean;
	readonly toggleFunction?: (newValue: boolean) => void;
}

export interface DropdownConfig {
	readonly options: readonly DropdownOption[];
	readonly afterSelection?: (newValue: string) => void;
	readonly isYesNoLimited?: boolean;
}
export interface DropdownOption {
	readonly value: string;
	readonly label: string;
	readonly disabled?: boolean;
}
export interface SliderConfig {
	readonly min: number;
	readonly max: number;
	readonly snapSensitivity: number;
	readonly showCurrentValue?: boolean;
	readonly knobs?: readonly Knob[];
}
export interface TextInputConfig {
	readonly onInputUpdate: (value: string, context: SettingContext) => void;
}

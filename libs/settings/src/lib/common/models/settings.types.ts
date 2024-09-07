import { ComponentType } from '@angular/cdk/portal';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AnalyticsService, ILocalizationService, OverwolfService } from '@firestone/shared/framework/core';

export interface SettingContext {
	readonly prefs: PreferencesService;
	readonly analytics: AnalyticsService;
	readonly ow: OverwolfService;
	readonly i18n: ILocalizationService;
}

export interface SettingNode {
	readonly id: string;
	readonly name: string;
	readonly keywords: readonly string[] | null;
	readonly children: readonly SettingNode[] | null;
	readonly sections?: readonly (Section | SectionReference)[];
}

// Not sure how to do this, but the idea is to simply specify a manually crafted component that we insert
export interface SectionReference {
	// TODO: have an interface to signal that a component can be inserted in the settings?
	readonly componentType: ComponentType<any>;
}

export interface Section {
	readonly id: string;
	readonly title: string;
	readonly texts?: readonly string[]; // Raw HTML
	readonly settings?: readonly Setting[];
	readonly disabledIf?: (context: SettingContext) => boolean;
	// TODO: how to handle the buttons that let you reset the widget positions?
	readonly buttons?: readonly SettingButton[];
	// need text, tooltip, action, confirmation
}

export interface SettingButton {
	readonly text: string;
	readonly tooltip: string;
	readonly action: (context: SettingContext) => void;
	readonly confirmation?: string;
}

export interface Setting {
	readonly type: 'toggle' | 'dropdown' | 'slider' | 'text-input';
	readonly field: keyof Preferences;
	readonly label: string;
	readonly tooltip: string;
	// E.g. if a setting can only be activated when the parent is on, and we want to display them as indented below them
	readonly childSettings?: readonly Setting[];
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
	readonly toggleFunction?: (context: SettingContext) => void;
}

export interface DropdownConfig {
	readonly options: readonly DropdownOption[];
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
	readonly knobs: readonly Knob[];
}
export interface Knob {
	readonly percentageValue?: number;
	readonly absoluteValue?: number;
	readonly label: string;
}
export interface TextInputConfig {
	readonly onInputUpdate: (value: string, context: SettingContext) => void;
}

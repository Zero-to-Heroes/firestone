import { Preferences } from '@firestone/shared/common/service';

export interface CounterSetting {
	readonly id: string;
	readonly field: keyof Preferences;
	readonly label: string;
	readonly tooltip: string;
	readonly showLimitedOption?: boolean;
}

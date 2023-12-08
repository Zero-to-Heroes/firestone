import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable } from 'rxjs';

@Component({
	selector: 'settings-discord',
	styleUrls: [
		`../../../../css/component/settings/settings-common.component.scss`,
		`../settings-section.scss`,
		`./settings-discord.component.scss`,
	],
	template: `
		<div class="settings-group" scrollable>
			<preference-toggle
				field="discordRichPresence"
				[label]="'settings.general.discord.discord-presence-label' | owTranslate"
				[tooltip]="'settings.general.discord.discord-presence-tooltip' | owTranslate"
			></preference-toggle>
		</div>
		<!-- Premimm config -->
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDiscordComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	discordEnabled$: Observable<boolean>;

	constructor(protected readonly cdr: ChangeDetectorRef, private readonly prefs: PreferencesService) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.discordEnabled$ = this.prefs
			.preferences$((prefs) => prefs.discordRichPresence)
			.pipe(this.mapData(([discord]) => discord));
	}
}

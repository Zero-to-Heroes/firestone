import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewRef } from '@angular/core';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'settings-decktracker-launch',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-launch.component.scss`,
	],
	template: `
		<div class="settings-group decktracker-launch">
			<h2 class="modes">Decktracker is active for the following modes</h2>
			<section class="toggle-label">
				<form class="settings-section form-toggle">
					<fieldset name="">
						<div class="form-section">
							<input
								hidden
								type="checkbox"
								[checked]="showRanked"
								name=""
								id="a-01"
								(change)="toggleRanked()"
							/>
							<label for="a-01" [ngClass]="{ 'enabled': showRanked }">
								<p class="settings-p">Ranked</p>
								<b></b>
							</label>
						</div>
					</fieldset>
				</form>
				<form class="settings-section form-toggle">
					<fieldset name="">
						<div class="form-section">
							<input
								hidden
								type="checkbox"
								[checked]="showArena"
								name=""
								id="a-02"
								(change)="toggleArena()"
							/>
							<label for="a-02" [ngClass]="{ 'enabled': showArena }">
								<p class="settings-p">Arena</p>
								<b></b>
							</label>
						</div>
					</fieldset>
				</form>
				<form class="settings-section form-toggle">
					<fieldset name="">
						<div class="form-section">
							<input
								hidden
								type="checkbox"
								[checked]="showTavernBrawl"
								name=""
								id="a-03"
								(change)="toggleTavernBrawl()"
							/>
							<label for="a-03" [ngClass]="{ 'enabled': showTavernBrawl }">
								<p class="settings-p">Tavern Brawl</p>
								<b></b>
							</label>
						</div>
					</fieldset>
				</form>
				<form class="settings-section form-toggle">
					<fieldset name="">
						<div class="form-section">
							<input
								hidden
								type="checkbox"
								[checked]="showPractice"
								name=""
								id="a-04"
								(change)="togglePractice()"
							/>
							<label for="a-04" [ngClass]="{ 'enabled': showPractice }">
								<p class="settings-p">Practice</p>
								<b></b>
							</label>
						</div>
					</fieldset>
				</form>
				<form class="settings-section form-toggle">
					<fieldset name="">
						<div class="form-section">
							<input
								hidden
								type="checkbox"
								[checked]="showFriendly"
								name=""
								id="a-05"
								(change)="toggleFriendly()"
							/>
							<label for="a-05" [ngClass]="{ 'enabled': showFriendly }">
								<p class="settings-p">Friendly</p>
								<b></b>
							</label>
						</div>
					</fieldset>
				</form>
				<form class="settings-section form-toggle">
					<fieldset name="">
						<div class="form-section">
							<input
								hidden
								type="checkbox"
								[checked]="showCasual"
								name=""
								id="a-06"
								(change)="toggleCasual()"
							/>
							<label for="a-06" [ngClass]="{ 'enabled': showCasual }">
								<p class="settings-p">Casual</p>
								<b></b>
							</label>
						</div>
					</fieldset>
				</form>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerLaunchComponent {
	showRanked: boolean;
	showArena: boolean;
	showTavernBrawl: boolean;
	showPractice: boolean;
	showFriendly: boolean;
	showCasual: boolean;

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef, private el: ElementRef) {
		this.cdr.detach();
		this.loadDefaultValues();
	}

	toggleRanked() {
		this.showRanked = !this.showRanked;
		this.prefs.setDecktrackerShowRanked(this.showRanked);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleArena() {
		this.showArena = !this.showArena;
		this.prefs.setDecktrackerShowArena(this.showArena);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleTavernBrawl() {
		this.showTavernBrawl = !this.showTavernBrawl;
		this.prefs.setDecktrackerShowTavernBrawl(this.showTavernBrawl);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	togglePractice() {
		this.showPractice = !this.showPractice;
		this.prefs.setDecktrackerShowPractice(this.showPractice);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleFriendly() {
		this.showFriendly = !this.showFriendly;
		this.prefs.setDecktrackerShowFriendly(this.showFriendly);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleCasual() {
		this.showCasual = !this.showCasual;
		this.prefs.setDecktrackerShowCasual(this.showCasual);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.showArena = prefs.decktrackerShowArena;
		this.showRanked = prefs.decktrackerShowRanked;
		this.showTavernBrawl = prefs.decktrackerShowTavernBrawl;
		this.showPractice = prefs.decktrackerShowPractice;
		this.showFriendly = prefs.decktrackerShowFriendly;
		this.showCasual = prefs.decktrackerShowCasual;
		// console.log('loaded prefs', prefs);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}

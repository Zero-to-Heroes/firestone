import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'settings-decktracker-features',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-features.component.scss`,
	],
	template: `
		<div class="decktracker-features">
			<h2 class="modes">The following features are active</h2>
			<section class="toggle-label">
				<form class="settings-section form-toggle">
					<fieldset name="">
						<div class="form-section">
							<input
								hidden
								type="checkbox"
								[checked]="showOpponentTurnDraw"
								name=""
								id="a-01"
								(change)="toggleOpponentTurnDraw()"
							/>
							<label for="a-01" [ngClass]="{ 'enabled': showOpponentTurnDraw }">
								<p class="settings-p">
									Opponent's card turn draw
									<i class="info">
										<svg>
											<use xlink:href="/Files/assets/svg/sprite.svg#info" />
										</svg>
										<div class="zth-tooltip right">
											<p>Show the turn at which a card in the opponent's hand was drawn</p>
											<svg
												class="tooltip-arrow"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 16 9"
											>
												<polygon points="0,0 8,-9 16,0" />
											</svg>
										</div>
									</i>
								</p>
								<b></b>
							</label>
						</div>
					</fieldset>
					<fieldset name="">
						<div class="form-section">
							<input
								hidden
								type="checkbox"
								[checked]="showOpponentGuess"
								name=""
								id="a-02"
								(change)="toggleOpponentGuess()"
							/>
							<label for="a-02" [ngClass]="{ 'enabled': showOpponentGuess }">
								<p class="settings-p">
									Opponent guessed cards
									<i class="info">
										<svg>
											<use xlink:href="/Files/assets/svg/sprite.svg#info" />
										</svg>
										<div class="zth-tooltip right">
											<p>
												Show what card is in the opponent's hand when we know it (after it has
												been sent back to their hand with a Sap for instance)
											</p>
											<svg
												class="tooltip-arrow"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 16 9"
											>
												<polygon points="0,0 8,-9 16,0" />
											</svg>
										</div>
									</i>
								</p>
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
export class SettingsDecktrackerFeaturesComponent {
	showOpponentTurnDraw: boolean;
	showOpponentGuess: boolean;

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef) {
		this.cdr.detach();
		this.loadDefaultValues();
	}

	toggleOpponentTurnDraw() {
		this.showOpponentTurnDraw = !this.showOpponentTurnDraw;
		this.prefs.setDectrackerShowOpponentTurnDraw(this.showOpponentTurnDraw);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleOpponentGuess() {
		this.showOpponentGuess = !this.showOpponentGuess;
		this.prefs.setDectrackerShowOpponentGuess(this.showOpponentGuess);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.showOpponentTurnDraw = prefs.dectrackerShowOpponentTurnDraw;
		this.showOpponentGuess = prefs.dectrackerShowOpponentGuess;
		// console.log('loaded prefs', prefs);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}

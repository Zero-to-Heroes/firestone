import { Component, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, ElementRef, ViewRef } from '@angular/core';
import { PreferencesService } from '../../../services/preferences.service';
import { FormGroup, FormControl } from '@angular/forms';

declare var ga;

@Component({
	selector: 'settings-decktracker-appearance',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-appearance.component.scss`,
	],
	template: `
        <div class="decktracker-appearance">
            <form class="skin-form" [formGroup]="skinForm">
                <input type="radio" formControlName="selectedSkin" value="original" id="skin-original">
                <label for="skin-original" class="skin-original">
                    <i class="unselected" *ngIf="skinForm.value.selectedSkin !== 'original'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_unselected"/>
                        </svg>
                    </i>
                    <i class="checked" *ngIf="skinForm.value.selectedSkin === 'original'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_selected"/>
                        </svg>
                    </i>
                    <p>Original</p>
                    <i class="info">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#info"/>
                        </svg>
                        <div class="zth-tooltip right">
                            <p>The decktracker, as imagined by its creators</p>
                            <svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
                                <polygon points="0,0 8,-9 16,0"/>
                            </svg>
                        </div>
                    </i>
                </label>

                <input type="radio" formControlName="selectedSkin" value="clean" id="skin-clean">
                <label for="skin-clean" class="skin-clean">
                    <i class="unselected" *ngIf="skinForm.value.selectedSkin !== 'clean'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_unselected"/>
                        </svg>
                    </i>
                    <i class="checked" *ngIf="skinForm.value.selectedSkin === 'clean'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_selected"/>
                        </svg>
                    </i>
                    <p>Clean</p>
                    <i class="info">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#info"/>
                        </svg>
                        <div class="zth-tooltip right">
                            <p>Removes almost everything that is not your decklist. You can't group the cards by zone in this mode</p>
                            <svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
                                <polygon points="0,0 8,-9 16,0"/>
                            </svg>
                        </div>
                    </i>
                </label>
            </form>
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerAppearanceComponent {
	
	skinForm = new FormGroup({
		selectedSkin: new FormControl('original'),
	});

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef, private el: ElementRef) {
		this.cdr.detach();
		this.loadDefaultValues();
		this.skinForm.controls['selectedSkin'].valueChanges.subscribe((value) => this.changeSkinSettings(value));
	}

	changeSkinSettings(newSkin: string) {
        // console.log('changing skin settings', newSkin, this.skinForm.value.selectedSkin);
        this.skinForm.controls['selectedSkin'].setValue(newSkin, {emitEvent: false});
		this.prefs.setDecktrackerSkin(newSkin);
        // console.log('changedg skin settings', newSkin, this.skinForm.value.selectedSkin);
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async loadDefaultValues() {
        const prefs = await this.prefs.getPreferences();
        this.skinForm.controls['selectedSkin'].setValue(prefs.decktrackerSkin, {emitEvent: false});
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}
}

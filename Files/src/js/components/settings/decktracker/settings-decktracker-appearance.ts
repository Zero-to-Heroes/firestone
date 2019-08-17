import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/internal/operators';
import { PreferencesService } from '../../../services/preferences.service';

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
			<form class="skin-form settings-group" [formGroup]="skinForm">
				<div class="title">Active skin</div>
				<input type="radio" formControlName="selectedSkin" value="original" id="skin-original" />
				<label for="skin-original" class="skin-original">
					<i class="unselected" *ngIf="skinForm.value.selectedSkin !== 'original'">
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#radio_unselected" />
						</svg>
					</i>
					<i class="checked" *ngIf="skinForm.value.selectedSkin === 'original'">
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#radio_selected" />
						</svg>
					</i>
					<p>Original</p>
					<i class="info">
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#info" />
						</svg>
						<div class="zth-tooltip right">
							<p>The decktracker, as imagined by its creators</p>
							<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
								<polygon points="0,0 8,-9 16,0" />
							</svg>
						</div>
					</i>
				</label>

				<input type="radio" formControlName="selectedSkin" value="clean" id="skin-clean" />
				<label for="skin-clean" class="skin-clean">
					<i class="unselected" *ngIf="skinForm.value.selectedSkin !== 'clean'">
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#radio_unselected" />
						</svg>
					</i>
					<i class="checked" *ngIf="skinForm.value.selectedSkin === 'clean'">
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#radio_selected" />
						</svg>
					</i>
					<p>Clean</p>
					<i class="info">
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#info" />
						</svg>
						<div class="zth-tooltip right">
							<p>Removes almost everything that is not your decklist. You can't group the cards by zone in this mode</p>
							<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
								<polygon points="0,0 8,-9 16,0" />
							</svg>
						</div>
					</i>
				</label>
			</form>
			<div class="scale-form">
				<label for="decktracker-scale">
					Change size
					<i class="info">
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#info" />
						</svg>
						<div class="zth-tooltip right">
							<p>
								Change the tracker size (best to use it while in-game to see the effects as you change it)
							</p>
							<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
								<polygon points="0,0 8,-9 16,0" />
							</svg>
						</div>
					</i>
				</label>
				<input
					type="range"
					name="decktracker-scale"
					class="scale-slider"
					min="50"
					max="200"
					(mousedown)="onScaleMouseDown($event)"
					[(ngModel)]="trackerScale"
					(ngModelChange)="onScaleChange($event)"
				/>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerAppearanceComponent {
	skinForm = new FormGroup({
		selectedSkin: new FormControl('original'),
	});
	trackerScale: number;
	trackerScaleChanged: Subject<number> = new Subject<number>();

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef, private el: ElementRef) {
		this.cdr.detach();
		this.loadDefaultValues();
		this.skinForm.controls['selectedSkin'].valueChanges.subscribe(value => this.changeSkinSettings(value));
		this.trackerScaleChanged
			.pipe(
				debounceTime(20),
				distinctUntilChanged(),
			)
			.subscribe(model => {
				this.trackerScale = model;
				console.log('changing scale value', this.trackerScale);
				this.prefs.setDecktrackerScale(this.trackerScale);
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			});
	}

	changeSkinSettings(newSkin: string) {
		// console.log('changing skin settings', newSkin, this.skinForm.value.selectedSkin);
		this.skinForm.controls['selectedSkin'].setValue(newSkin, { emitEvent: false });
		this.prefs.setDecktrackerSkin(newSkin);
		// console.log('changedg skin settings', newSkin, this.skinForm.value.selectedSkin);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onScaleChange(newScale: number): void {
		this.trackerScaleChanged.next(newScale);
	}

	// Prevent drag & drop while dragging the slider
	onScaleMouseDown(event: MouseEvent) {
		event.stopPropagation();
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.skinForm.controls['selectedSkin'].setValue(prefs.decktrackerSkin, { emitEvent: false });
		this.trackerScale = prefs.decktrackerScale;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}

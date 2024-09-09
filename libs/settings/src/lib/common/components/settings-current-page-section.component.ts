/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, filter, Observable, switchMap } from 'rxjs';
import { Section, Setting, SettingButton } from '../models/settings.types';

@Component({
	selector: 'settings-current-page-section',
	styleUrls: [`../../settings-common.component.scss`, `./settings-current-page-section.component.scss`],
	template: `
		<div class="section">
			<div class="title" *ngIf="title$ | async as title">{{ title }}</div>
			<div class="settings-group" [ngClass]="{ disabled: disabled$ | async }">
				<div class="section-text" *ngFor="let text of texts$ | async" [innerHTML]="text"></div>
				<ng-container *ngFor="let setting of settings$ | async">
					<ng-container *ngIf="isStandardSetting(setting)">
						<setting-element [setting]="setting"> </setting-element>
					</ng-container>
					<ng-container *ngIf="isSettingButton(setting)">
						<setting-button [setting]="setting"> </setting-button>
					</ng-container>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCurrentPageSectionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	title$: Observable<string | null>;
	texts$: Observable<readonly string[] | null>;
	settings$: Observable<readonly (Setting | SettingButton)[] | null>;
	disabled$: Observable<boolean | undefined>;

	@Input() set section(value: Section) {
		this.section$$.next(value);
	}

	private section$$ = new BehaviorSubject<Section | null>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.title$ = this.section$$.pipe(this.mapData((section) => section?.title ?? null));
		this.texts$ = this.section$$.pipe(this.mapData((section) => section?.texts ?? null));
		this.settings$ = this.section$$.pipe(this.mapData((section) => section?.settings ?? null));
		this.disabled$ = this.section$$.pipe(
			filter((section) => !!section?.disabled$),
			switchMap((section) => section!.disabled$!()),
			this.mapData((disabled) => disabled),
		);
	}

	isStandardSetting(setting: Setting | SettingButton): setting is Setting {
		return (setting as Setting).field !== undefined;
	}

	isSettingButton(setting: Setting | SettingButton): setting is SettingButton {
		return (setting as SettingButton).action !== undefined;
	}
}

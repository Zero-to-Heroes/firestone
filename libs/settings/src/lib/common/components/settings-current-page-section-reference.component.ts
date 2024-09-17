/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ComponentType } from '@angular/cdk/portal';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SectionReference, SettingsSectionReferenceType } from '../models/settings.types';
import { SettingsControllerService } from '../services/settings-controller.service';
import { AppearanceCustomizationPageComponent } from './custom-pages/appearance-customization.component';
import { SettingsGeneralBugReportComponent } from './custom-pages/settings-general-bug-report.component';

@Component({
	selector: 'settings-current-page-section-reference',
	styleUrls: [`../../settings-common.component.scss`, `./settings-current-page-section-reference.component.scss`],
	template: `
		<ng-container *ngIf="componentType$ | async as componentType">
			<ng-container *ngComponentOutlet="componentType"></ng-container>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCurrentPageSectionReferenceComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	componentType$: Observable<ComponentType<any> | null>;

	@Input() set section(value: SectionReference) {
		this.section$$.next(value);
	}

	// Would love to not have to define this mapping, but declaring the component type
	// directly when building the object doesn't work
	private componentMaps: Record<SettingsSectionReferenceType, ComponentType<any>> = {
		AppearanceCustomizationPageComponent: AppearanceCustomizationPageComponent,
		SettingsGeneralBugReportComponent: SettingsGeneralBugReportComponent,
	};

	private section$$ = new BehaviorSubject<SectionReference | null>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly controller: SettingsControllerService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.controller);

		this.componentType$ = this.section$$.pipe(
			this.mapData((section) => this.componentMaps[section?.componentType ?? ''] ?? null),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}

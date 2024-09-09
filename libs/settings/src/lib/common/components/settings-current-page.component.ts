import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { Section, SectionReference, SettingNode } from '../models/settings.types';
import { SettingsControllerService } from '../services/settings-controller.service';

@Component({
	selector: 'settings-current-page',
	styleUrls: [`../../settings-common.component.scss`, `./settings-current-page.component.scss`],
	template: `
		<div class="current-page" *ngIf="node$ | async as node">
			<div class="page-title">{{ node.name }}</div>
			<section class="section" *ngFor="let section of node.sections">
				<ng-container *ngIf="isSection(section)">
					<div class="title" *ngIf="section.title">{{ section.title }}</div>
					<div class="settings-group">
						<setting-element *ngFor="let setting of section.settings" [setting]="setting">
						</setting-element>
					</div>
				</ng-container>
				<!-- TODO: inject the component if it's a SectionReference -->
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCurrentPageComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	node$: Observable<SettingNode | null>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly controller: SettingsControllerService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.controller);

		this.node$ = this.controller.selectedNode$$.pipe(this.mapData((selectedNode) => selectedNode));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	isSection(section: Section | SectionReference): section is Section {
		return (section as Section).title !== undefined;
	}

	isSectionReference(section: Section | SectionReference): section is SectionReference {
		return (section as SectionReference).componentType !== undefined;
	}
}

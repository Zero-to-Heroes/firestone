/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { findNode } from '../models/settings-tree/_settings-definition';
import { Section, SectionReference, SettingNode } from '../models/settings.types';
import { SettingsControllerService } from '../services/settings-controller.service';

@Component({
	selector: 'settings-current-page',
	styleUrls: [
		`../../settings-common.component.scss`,
		`./settings-current-page.component.scss`,
		`./custom-pages/general-localization.scss`,
	],
	template: `
		<div class="current-page {{ node.cssClass }}" *ngIf="node$ | async as node">
			<div class="page-title">{{ node.name }}</div>
			<div class="sections" scrollable>
				<section class="section" *ngFor="let section of node.sections">
					<ng-container *ngIf="isSection(section)">
						<settings-current-page-section [section]="section"> </settings-current-page-section>
					</ng-container>
					<ng-container *ngIf="isSectionReference(section)">
						<settings-current-page-section-reference [section]="section">
						</settings-current-page-section-reference>
					</ng-container>
				</section>
			</div>
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

		this.node$ = this.controller.selectedNodeId$$.pipe(
			this.mapData((selectedNodeId) => findNode(this.controller.rootNode$$.value, selectedNodeId)),
		);

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

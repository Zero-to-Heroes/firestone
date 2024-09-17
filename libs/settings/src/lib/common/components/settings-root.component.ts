/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	AnalyticsService,
	IAdsService,
	ILocalizationService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { findNode, settingsDefinition } from '../models/settings-tree/settings-definition';
import { SettingContext, SettingNode } from '../models/settings.types';
import { SettingsControllerService } from '../services/settings-controller.service';

@Component({
	selector: 'settings-root',
	styleUrls: [`../../settings-common.component.scss`, `./settings-root.component.scss`],
	template: `
		<div class="settings-root">
			<nav class="navigation" *ngIf="rootNode">
				<div class="header" [fsTranslate]="'settings.title'"></div>
				<ul class="nodes">
					<settings-navigation-node
						*ngFor="let child of rootNode.children"
						[node]="child"
						[indentLevel]="0"
					></settings-navigation-node>
				</ul>
			</nav>
			<div class="current-section">
				<settings-current-page></settings-current-page>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsRootComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	rootNode: SettingNode;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
		private readonly analytics: AnalyticsService,
		private readonly ow: OverwolfService,
		private readonly controller: SettingsControllerService,
		@Inject(ADS_SERVICE_TOKEN) private readonly adService: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.adService, this.controller);

		const context: SettingContext = {
			prefs: this.prefs,
			analytics: this.analytics,
			ow: this.ow,
			i18n: this.i18n,
			adService: this.adService,
		};
		this.rootNode = settingsDefinition(context);
		this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.locale)).subscribe((locale) => {
			const selectedNodeId = this.controller.selectedNode$$.value?.id;
			this.rootNode = settingsDefinition(context);
			const newSelectedNode = findNode(this.rootNode, selectedNodeId);
			this.controller.selectedNode$$.next(newSelectedNode);
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});

		if (!this.controller.selectedNode$$.value) {
			this.controller.selectedNode$$.next(this.rootNode.children![0].children![0]);
		}

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}

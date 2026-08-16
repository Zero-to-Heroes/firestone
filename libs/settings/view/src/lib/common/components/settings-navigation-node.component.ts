import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { SettingNode, SettingsControllerService } from '@firestone/settings/services';
import { FeatureSpotlightsService, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { nodeHasSpotlight } from '../services/search';

@Component({
	standalone: false,
	selector: 'settings-navigation-node',
	styleUrls: [`../../settings-common.component.scss`, `./settings-navigation-node.component.scss`],
	template: `
		<div
			class="navigation-node"
			[ngClass]="{
				'is-leaf': !_node.children?.length,
				selected: isSelected$ | async,
				selectable: selectable,
			}"
		>
			<div class="name" (click)="selectNode()">
				{{ _node.name }}
				<span class="new-dot" *ngIf="hasUnseen$ | async"></span>
			</div>
			<settings-navigation-node
				*ngFor="let child of _node.children"
				class="child-node"
				[node]="child"
				[indentLevel]="_indentLevel + 1"
			></settings-navigation-node>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsNavigationNodeComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	isSelected$: Observable<boolean>;
	collapsed$: Observable<boolean>;
	hasUnseen$: Observable<boolean>;

	@Input() set node(value: SettingNode) {
		this._node = value;
		this.selectable = !!value.sections?.length;
	}

	@Input() set indentLevel(value: number) {
		this._indentLevel = value;
		this.el.nativeElement.style.setProperty('--settings-indent-level', `${value}`);
	}

	_node: SettingNode;
	_indentLevel: number;
	selectable: boolean;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly renderer: Renderer2,
		private readonly el: ElementRef,
		private readonly controller: SettingsControllerService,
		private readonly spotlights: FeatureSpotlightsService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.controller, this.spotlights, this.prefs);

		this.isSelected$ = this.controller.selectedNodeId$$.pipe(
			this.mapData((selectedNodeId) => selectedNodeId === this._node?.id),
		);
		this.hasUnseen$ = combineLatest([this.spotlights.activeSpotlights$$, this.prefs.preferences$$]).pipe(
			this.mapData(([active, prefs]) => {
				if (!this._node) {
					return false;
				}
				const unseen = (active ?? []).filter(
					(spotlight) => !(prefs?.seenSpotlightIds ?? []).includes(spotlight.id),
				);
				const targets = this.spotlights.getTargets(unseen);
				return nodeHasSpotlight(this._node, targets.prefFields, targets.nodeIds);
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	selectNode() {
		if (this.selectable) {
			this.controller.selectNodeId(this._node?.id);
		}
	}
}

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
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { SettingNode } from '../models/settings.types';
import { SettingsControllerService } from '../services/settings-controller.service';

@Component({
	selector: 'settings-navigation-node',
	styleUrls: [`../../settings-common.component.scss`, `./settings-navigation-node.component.scss`],
	template: `
		<div class="navigation-node" [ngClass]="{ 'is-leaf': !node.children?.length, selected: isSelected$ | async }">
			<div class="name" (click)="selectNode()">{{ node.name }}</div>
			<settings-navigation-node
				*ngFor="let child of node.children"
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

	@Input() node: SettingNode;

	@Input() set indentLevel(value: number) {
		this._indentLevel = value;
		this.el.nativeElement.style.setProperty('--settings-indent-level', `${value}`);
	}

	_indentLevel: number;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly renderer: Renderer2,
		private readonly el: ElementRef,
		private readonly controller: SettingsControllerService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.controller);

		this.isSelected$ = this.controller.selectedNode$$.pipe(
			this.mapData((selectedNode) => selectedNode === this.node),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectNode() {
		this.controller.selectNode(this.node);
	}
}

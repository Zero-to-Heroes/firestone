import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { filter } from 'rxjs';

@Component({
	selector: 'website-navigation',
	styleUrls: [`./website-navigation.component.scss`],
	template: `
		<nav class="menu-selection">
			<website-navigation-node
				*ngFor="let node of navigationNodes"
				[node]="node"
				[selectedModule]="selectedModule"
			>
			</website-navigation-node>

			<div class="desktop-app-cta">
				<div class="header" [translate]="'website.desktop-app.navigation-cta-header'"></div>
				<div class="text" [translate]="'website.desktop-app.navigation-cta-text'"></div>
				<a
					class="download-button"
					[translate]="'website.desktop-app.navigation-cta-button-text'"
					href="https://www.firestoneapp.com/"
					target="_blank"
				></a>
			</div>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteNavigationComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	navigationNodes: readonly Node[] = [
		{
			id: 'battlegrounds',
			icon: 'assets/svg/whatsnew/battlegrounds.svg',
			name: this.i18n.translateString('app.menu.battlegrounds-header'),
		},
		{
			id: 'duels',
			icon: 'assets/svg/whatsnew/duels.svg',
			name: this.i18n.translateString('app.menu.duels-header'),
			nodes: [
				{
					id: 'duels/hero',
					icon: 'assets/svg/hero.svg',
					name: this.i18n.translateString('app.menu.duels-hero-header'),
				},
				{
					id: 'duels/hero-power',
					icon: 'assets/svg/hero-power.svg',
					name: this.i18n.translateString('app.menu.duels-hero-power-header'),
				},
				{
					id: 'duels/signature-treasure',
					icon: 'assets/svg/signature-treasure.svg',
					name: this.i18n.translateString('app.menu.duels-signature-treasure-header'),
				},
				{
					id: 'duels/passive-treasure',
					icon: 'assets/svg/passive-treasure.svg',
					name: this.i18n.translateString('app.menu.duels-passive-treasure-header'),
				},
				{
					id: 'duels/active-treasure',
					icon: 'assets/svg/active-treasure.svg',
					name: this.i18n.translateString('app.menu.duels-active-treasure-header'),
				},
			],
		},
		{
			id: 'profile',
			icon: 'assets/svg/profile.svg',
			name: this.i18n.translateString('app.menu.profile-header'),
			nodes: [
				{
					id: 'profile/overview',
					icon: 'assets/svg/profile_overview.svg',
					name: this.i18n.translateString('app.menu.profile-overview-header'),
				},
				{
					id: 'profile/collection',
					icon: 'assets/svg/whatsnew/collection.svg',
					name: this.i18n.translateString('app.menu.collection-header'),
				},
			],
		},
	];

	selectedModule = this.navigationNodes[0].id;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly router: Router,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		console.debug('[nav] router', this.router, this.router.routerState?.snapshot?.url);
		this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
			this.selectedModule = (event as NavigationEnd).urlAfterRedirects?.replace('/', '');
			console.debug('[nav] selected module', this.selectedModule, event);
		});
		this.router.events.pipe().subscribe((event) => {
			console.debug('[nav] all-events', event);
		});
		this.selectedModule = this.router.routerState?.snapshot?.url?.replace('/', '');
		console.debug('[nav] selected module', this.selectedModule);
	}
}

@Component({
	selector: 'website-navigation-node',
	styleUrls: [`./website-navigation.component.scss`],
	template: `
		<button
			[attr.tabindex]="0"
			type="button"
			class="menu-item depth-{{ depth }} {{ cssClass() }}"
			[attr.aria-label]="node.name"
			[ngClass]="{ selected: isSelected() }"
			(click)="selectModule(node.id)"
		>
			<div class="icon" *ngIf="node.icon" [inlineSVG]="node.icon"></div>
			<div class="menu-name">{{ node.name }}</div>
		</button>
		<ul class="sub-nodes" *ngIf="node.nodes?.length && isSelected()">
			<website-navigation-node
				*ngFor="let sub of node.nodes"
				[node]="sub"
				[selectedModule]="selectedModule"
				[depth]="depth + 1"
			>
			</website-navigation-node>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteNavigationNodeComponent {
	@Input() node: Node;
	@Input() selectedModule: string;
	@Input() depth = 0;

	constructor(private readonly router: Router) {}

	selectModule(target: string) {
		console.debug('[nav] selecting', target);
		this.router.navigate([`/${target}`]);
	}

	isSelected(): boolean {
		const pathNodes = this.selectedModule.split('/');
		const selected = this.selectedModule.startsWith(this.node.id + '/') || this.selectedModule === this.node.id;
		console.debug('[nav] selected', this.node.id, selected, this.selectedModule, this.node);
		return selected;
	}

	cssClass(): string {
		return this.node.id.replace('/', '-');
	}
}

interface Node {
	id: string;
	name: string | null;
	icon?: string;
	nodes?: readonly Node[];
}

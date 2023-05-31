/* eslint-disable no-mixed-spaces-and-tabs */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Store } from '@ngrx/store';
import { startProfileShare, startProfileUnshare } from 'libs/website/profile/src/lib/+state/website/pofile.actions';
import { WebsiteProfileState } from 'libs/website/profile/src/lib/+state/website/profile.models';
import { getShareAlias, getWatchingOtherPlayer } from 'libs/website/profile/src/lib/+state/website/profile.selectors';
import { BehaviorSubject, Observable, combineLatest, filter, map } from 'rxjs';

@Component({
	selector: 'website-navigation',
	styleUrls: [`./website-navigation.component.scss`],
	template: `
		<nav class="menu-selection">
			<website-navigation-node
				*ngFor="let node of navigationNodes$ | async"
				[node]="node"
				[selectedModule]="selectedModule"
			>
			</website-navigation-node>

			<div class="desktop-app-cta">
				<div class="header" [fsTranslate]="'website.desktop-app.navigation-cta-header'"></div>
				<div class="text" [fsTranslate]="'website.desktop-app.navigation-cta-text'"></div>
				<a
					class="download-button"
					[fsTranslate]="'website.desktop-app.navigation-cta-button-text'"
					href="https://www.firestoneapp.com/"
					target="_blank"
				></a>
			</div>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteNavigationComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	navigationNodes$: Observable<readonly Node[]>;

	selectedModule: string;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly router: Router,
		private readonly i18n: ILocalizationService,
		private readonly profileStore: Store<WebsiteProfileState>,
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

		this.navigationNodes$ = combineLatest([
			this.profileStore.select(getShareAlias),
			this.profileStore.select(getWatchingOtherPlayer),
		]).pipe(
			map(([alias, watchingOtherPlayer]) => {
				const battlegroundsNode = !!watchingOtherPlayer?.length
					? null
					: {
							id: 'battlegrounds',
							icon: 'assets/svg/whatsnew/battlegrounds.svg',
							name: this.i18n.translateString('app.menu.battlegrounds-header'),
					  };
				const duelsNode = !!watchingOtherPlayer?.length
					? null
					: {
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
					  };

				const profileButtonLabel = !!alias?.length
					? this.i18n.translateString('app.menu.profile-shared-button-text')
					: this.i18n.translateString('app.menu.profile-share-button-text');
				const profileButtonTooltip = !!alias?.length
					? this.i18n.translateString('app.menu.profile-shared-button-tooltip', {
							shareAlias: alias,
					  })
					: this.i18n.translateString('app.menu.profile-share-button-tooltip');
				const profileButtonAction = alias?.length
					? () => this.profileStore.dispatch(startProfileUnshare())
					: () => this.profileStore.dispatch(startProfileShare());
				const profileWatchFragment = watchingOtherPlayer?.length ? `/${watchingOtherPlayer}` : '';
				return [
					battlegroundsNode,
					duelsNode,
					{
						id: 'profile',
						icon: 'assets/svg/profile.svg',
						name: this.i18n.translateString('app.menu.profile-header'),
						nodes: [
							{
								id: `profile${profileWatchFragment}/overview`,
								icon: 'assets/svg/profile_overview.svg',
								name: this.i18n.translateString('app.menu.profile-overview-header'),
							},
							{
								id: `profile${profileWatchFragment}/collection`,
								icon: 'assets/svg/whatsnew/collection.svg',
								name: this.i18n.translateString('app.menu.collection-header'),
							},
							!!watchingOtherPlayer?.length
								? null
								: {
										id: 'profile-share-button',
										name: profileButtonLabel,
										tooltip: profileButtonTooltip,
										click: profileButtonAction,
								  },
						].filter((node) => !!node),
					},
				].filter((node) => !!node);
			}),
		);
	}
}

@Component({
	selector: 'website-navigation-node',
	styleUrls: [`./website-navigation.component.scss`],
	template: `
		<ng-container *ngIf="_node">
			<button
				[attr.tabindex]="0"
				type="button"
				class="menu-item depth-{{ depth }} {{ cssClass }}"
				[attr.aria-label]="_node.name"
				[ngClass]="{ selected: isSelected }"
				(click)="selectModule(_node.id)"
				[helpTooltip]="_node.tooltip"
			>
				<div class="icon" *ngIf="_node.icon" [inlineSVG]="_node.icon"></div>
				<div class="menu-name">{{ _node.name }}</div>
			</button>
			<ul class="sub-nodes" *ngIf="_node.nodes?.length && isSelected">
				<website-navigation-node
					*ngFor="let sub of _node.nodes"
					[node]="sub"
					[selectedModule]="_selectedModule"
					[depth]="depth + 1"
				>
				</website-navigation-node>
			</ul>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteNavigationNodeComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() depth = 0;
	@Input() set node(value: Node) {
		this._node = value;
		this.cssClass = value.id.replace('/', '-');
		this.node$$.next(value);
	}
	@Input() set selectedModule(value: string) {
		this._selectedModule = value;
		this.selectedModule$$.next(value);
	}

	_node: Node;
	_selectedModule: string;
	name: string;
	isSelected: boolean;
	cssClass: string;

	private node$$ = new BehaviorSubject<Node>(null);
	private selectedModule$$ = new BehaviorSubject<string>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly router: Router) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		combineLatest([this.node$$, this.selectedModule$$])
			.pipe(
				filter(([node, selectedModule]) => !!node && !!selectedModule),
				this.mapData((info) => info),
			)
			.subscribe(([node, selectedModule]) => {
				const selected = selectedModule.startsWith(node.id + '/') || selectedModule === node.id;
				this.isSelected = selected;
				console.debug('[nav] selected', node.id, this.isSelected, selected, selectedModule, node);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
	}

	selectModule(target: string) {
		console.debug('[nav] selecting', target, this._node);
		if (this._node.click) {
			this._node.click();
		} else {
			this.router.navigate([`/${target}`]);
		}
	}
}

interface Node {
	id: string;
	name: string | null;
	tooltip?: string;
	icon?: string;
	click?: () => void;
	nodes?: readonly Node[];
}

import { Route } from '@angular/router';
import { WebsiteBattlegroundsComponent } from '@firestone/website/battlegrounds';
import { WebsiteAuthComponent, WebsitePremiumComponent } from '@firestone/website/core';
import {
	WebsiteDuelsActiveTreasuresComponent,
	WebsiteDuelsHeroPowersComponent,
	WebsiteDuelsHeroesComponent,
	WebsiteDuelsSignatureTreasuresComponent,
} from '@firestone/website/duels';
import {
	WebsiteProfileBattlegroundsComponent,
	WebsiteProfileCollectionComponent,
	WebsiteProfilePacksComponent,
	WebsiteProfileRankedComponent,
} from '@firestone/website/profile';
import { WebsiteDuelsPassiveTreasuresComponent } from 'libs/website/duels/src/lib/website-duels-passive-treasures.component';
import { WebsiteProfileOverviewComponent } from 'libs/website/profile/src/lib/overview/website-profile-overview.component';
import { AuthGuard } from './auth-guard.service';
import { PremiumRedirectGuard } from './premium-redirect.service';

export const appRoutes: Route[] = [
	{
		path: 'battlegrounds',
		component: WebsiteBattlegroundsComponent,
		canActivate: [AuthGuard],
	},
	{
		path: 'duels/hero',
		component: WebsiteDuelsHeroesComponent,
		canActivate: [AuthGuard],
	},
	{
		path: 'duels/hero-power',
		component: WebsiteDuelsHeroPowersComponent,
		canActivate: [AuthGuard],
	},
	{
		path: 'duels/signature-treasure',
		component: WebsiteDuelsSignatureTreasuresComponent,
		canActivate: [AuthGuard],
	},
	{
		path: 'duels/passive-treasure',
		component: WebsiteDuelsPassiveTreasuresComponent,
		canActivate: [AuthGuard],
	},
	{
		path: 'duels/active-treasure',
		component: WebsiteDuelsActiveTreasuresComponent,
		canActivate: [AuthGuard],
	},
	{
		path: 'duels',
		redirectTo: '/duels/hero',
		pathMatch: 'full',
	},
	{
		path: 'profile/overview',
		component: WebsiteProfileOverviewComponent,
		canActivate: [AuthGuard],
	},
	{
		path: 'profile/collection',
		component: WebsiteProfileCollectionComponent,
		canActivate: [AuthGuard],
	},
	{
		path: 'profile/packs',
		component: WebsiteProfilePacksComponent,
	},
	{
		path: 'profile/battlegrounds',
		component: WebsiteProfileBattlegroundsComponent,
		canActivate: [AuthGuard],
	},
	{
		path: 'profile/ranked',
		component: WebsiteProfileRankedComponent,
		canActivate: [AuthGuard],
	},
	// {
	// 	path: 'profile/achievements',
	// 	component: WebsiteProfileAchievementsComponent,
	// 	canActivate: [AuthGuard],
	// },
	{
		path: 'profile/:shareAlias/overview',
		component: WebsiteProfileOverviewComponent,
	},
	{
		path: 'profile/:shareAlias/collection',
		component: WebsiteProfileCollectionComponent,
	},
	{
		path: 'profile/:shareAlias/packs',
		component: WebsiteProfilePacksComponent,
	},
	{
		path: 'profile/:shareAlias/battlegrounds',
		component: WebsiteProfileBattlegroundsComponent,
	},
	{
		path: 'profile/:shareAlias/ranked',
		component: WebsiteProfileRankedComponent,
		canActivate: [AuthGuard],
	},
	// {
	// 	path: 'profile/:shareAlias/achievements',
	// 	component: WebsiteProfileAchievementsComponent,
	// },
	{
		path: 'profile/:shareAlias',
		redirectTo: '/profile/:shareAlias/overview',
		pathMatch: 'full',
	},
	{
		path: 'profile',
		redirectTo: '/profile/overview',
		pathMatch: 'full',
	},
	{
		path: 'premium',
		component: WebsitePremiumComponent,
		canActivate: [PremiumRedirectGuard],
		pathMatch: 'prefix',
	},
	{
		path: 'owAuth',
		component: WebsiteAuthComponent,
		pathMatch: 'prefix',
	},
	{
		path: '',
		redirectTo: '/profile/overview',
		pathMatch: 'prefix',
	},
	{
		path: '**',
		redirectTo: '/profile',
		pathMatch: 'prefix',
	},
];

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MainwindowCommonModule } from '@firestone/mainwindow/common';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsCommonModule } from '@firestone/stats/common';
import { CommunitiesDesktopComponent } from './components/communities-desktop.component';
import { CommunitiesJoinModalComponent } from './components/communities-join-modal.component';
import { CommunitiesJoinComponent } from './components/communities-join.component';
import { CommunityDetailsComponent } from './components/community-details.component';
import { CommunityFriendlyBattlePlayerComponent } from './components/details/community-friendly-battle-player.component';
import { CommunityFriendlyBattleComponent } from './components/details/community-friendly-battle.component';
import { CommunityInternalLadderComponent } from './components/details/community-internal-ladder.component';
import { CommunityLeaderboardsComponent } from './components/details/community-leaderboards.component';
import { CommunityOverviewComponent } from './components/details/community-overview.component';
import { MyCommunitiesComponent } from './components/my-communities.component';
import { CommunityBootstrapService } from './services/_community-bootstrap.service';
import { CommunityJoinService } from './services/community-join.service';
import { CommunityNavigationService } from './services/community-navigation.service';
import { CommunityProtocolHandlerService } from './services/community-protocol-handler.service';
import { PersonalCommunitiesService } from './services/personal-communities.service';

const components = [
	CommunitiesDesktopComponent,
	CommunitiesJoinComponent,
	CommunitiesJoinModalComponent,
	MyCommunitiesComponent,
	CommunityDetailsComponent,
	CommunityOverviewComponent,
	CommunityLeaderboardsComponent,
	CommunityInternalLadderComponent,
	CommunityFriendlyBattleComponent,
	CommunityFriendlyBattlePlayerComponent,
];

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,

		MainwindowCommonModule,
		SharedFrameworkCoreModule,
		SharedCommonViewModule,
		StatsCommonModule,
	],
	declarations: components,
	exports: components,
	providers: [
		CommunityBootstrapService,
		CommunityJoinService,
		CommunityProtocolHandlerService,
		CommunityNavigationService,
		PersonalCommunitiesService,
	],
})
export class CommunitiesCommonModule {}

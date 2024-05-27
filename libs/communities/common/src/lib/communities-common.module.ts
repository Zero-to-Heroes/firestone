import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { CommunitiesDesktopComponent } from './components/communities-desktop.component';
import { CommunitiesJoinModalComponent } from './components/communities-join-modal.component';
import { CommunitiesJoinComponent } from './components/communities-join.component';
import { MyCommunitiesComponent } from './components/my-communities.component';
import { CommunityBootstrapService } from './services/_community-bootstrap.service';
import { CommunityJoinService } from './services/community-join.service';
import { CommunityNavigationService } from './services/community-navigation.service';
import { PersonalCommunitiesService } from './services/personal-communities.service';

const components = [
	CommunitiesDesktopComponent,
	CommunitiesJoinComponent,
	CommunitiesJoinModalComponent,
	MyCommunitiesComponent,
];

@NgModule({
	imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedFrameworkCoreModule],
	declarations: components,
	exports: components,
	providers: [
		CommunityBootstrapService,
		CommunityJoinService,
		CommunityNavigationService,
		PersonalCommunitiesService,
	],
})
export class CommunitiesCommonModule {}

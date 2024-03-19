import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { CommunitiesDesktopComponent } from './components/communities-desktop.component';
import { CommunitiesJoinModalComponent } from './components/communities-join-modal.component';
import { CommunitiesJoinComponent } from './components/communities-join.component';
import { CommunityJoinService } from './services/community-join.service';

const components = [CommunitiesDesktopComponent, CommunitiesJoinComponent, CommunitiesJoinModalComponent];

@NgModule({
	imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedFrameworkCoreModule],
	declarations: components,
	exports: components,
	providers: [CommunityJoinService],
})
export class CommunitiesCommonModule {}

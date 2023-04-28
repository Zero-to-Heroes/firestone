import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { ProfileLoadDataService } from './profile-load-data.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule],
	providers: [ProfileLoadDataService]
})
export class ProfileDataAccessModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CollectionNavigationService } from './services/collection-navigation.service';

@NgModule({
	imports: [CommonModule],
	providers: [CollectionNavigationService],
})
export class CollectionCommonModule {}

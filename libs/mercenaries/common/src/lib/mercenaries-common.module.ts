import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MercenariesNavigationService } from './services/mercenaries-navigation.service';

@NgModule({
	imports: [CommonModule],
	providers: [MercenariesNavigationService],
})
export class MercenariesCommonModule {}

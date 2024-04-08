import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MainWindowNavigationService } from './services/main-window-navigation.service';

@NgModule({
	imports: [CommonModule],
	providers: [MainWindowNavigationService],
})
export class MainwindowCommonModule {}

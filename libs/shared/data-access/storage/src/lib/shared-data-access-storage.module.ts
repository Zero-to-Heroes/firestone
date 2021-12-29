import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenericStorageService } from './generic-storage.service';
import { LocalStorageService } from './local-storage.service';

@NgModule({
	imports: [CommonModule],
	providers: [GenericStorageService, LocalStorageService],
})
export class SharedDataAccessStorageModule {}

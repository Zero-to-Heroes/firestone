import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MemoryUpdate } from '../models/memory-update';

export const MEMORY_READING_SERVICE_TOKEN = new InjectionToken<IMemoryReadingService>('MemoryReadingService');
export interface IMemoryReadingService {
	memoryUpdates$$: BehaviorSubject<MemoryUpdate>;
}

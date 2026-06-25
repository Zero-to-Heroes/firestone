import { getPeMachineArchFromBuffer } from './pe-machine-type';

describe('getPeMachineArchFromBuffer', () => {
	it('returns null for empty buffer', () => {
		expect(getPeMachineArchFromBuffer(new Uint8Array(0))).toBeNull();
	});

	it('returns null for non-PE buffer', () => {
		expect(getPeMachineArchFromBuffer(new Uint8Array([0, 1, 2, 3]))).toBeNull();
	});

	it('detects x86 PE machine type', () => {
		const buffer = new Uint8Array(512);
		buffer[0] = 0x4d;
		buffer[1] = 0x5a;
		buffer[0x3c] = 0x80;
		buffer[0x80] = 0x50;
		buffer[0x81] = 0x45;
		buffer[0x84] = 0x4c;
		buffer[0x85] = 0x01;
		expect(getPeMachineArchFromBuffer(buffer)).toBe('x86');
	});

	it('detects x64 PE machine type', () => {
		const buffer = new Uint8Array(512);
		buffer[0] = 0x4d;
		buffer[1] = 0x5a;
		buffer[0x3c] = 0x80;
		buffer[0x80] = 0x50;
		buffer[0x81] = 0x45;
		buffer[0x84] = 0x64;
		buffer[0x85] = 0x86;
		expect(getPeMachineArchFromBuffer(buffer)).toBe('x64');
	});
});

export type PeMachineArch = 'x86' | 'x64';

const PE_MACHINE_I386 = 0x014c;
const PE_MACHINE_AMD64 = 0x8664;

/**
 * Reads the PE machine type from the first bytes of a Windows executable/DLL.
 * Returns null if the buffer is too small or not a valid PE file.
 */
export const getPeMachineArchFromBuffer = (buffer: Uint8Array | Buffer): PeMachineArch | null => {
	if (buffer.length < 0x40) {
		return null;
	}
	if (buffer[0] !== 0x4d || buffer[1] !== 0x5a) {
		// Not "MZ"
		return null;
	}
	const peOffset = buffer[0x3c] | (buffer[0x3d] << 8) | (buffer[0x3e] << 16) | (buffer[0x3f] << 24);
	if (peOffset + 6 > buffer.length) {
		return null;
	}
	if (
		buffer[peOffset] !== 0x50 ||
		buffer[peOffset + 1] !== 0x45 ||
		buffer[peOffset + 2] !== 0x00 ||
		buffer[peOffset + 3] !== 0x00
	) {
		return null;
	}
	const machine = buffer[peOffset + 4] | (buffer[peOffset + 5] << 8);
	if (machine === PE_MACHINE_I386) {
		return 'x86';
	}
	if (machine === PE_MACHINE_AMD64) {
		return 'x64';
	}
	return null;
};

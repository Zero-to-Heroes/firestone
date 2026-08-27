// Linux replacement for UnitySpy's Windows ProcessFacade.
//
//   EnumProcessModulesEx / GetModuleInformation  ->  parse /proc/<pid>/maps
//   ReadProcessMemory                            ->  pread on /proc/<pid>/mem
//
// Reading /proc/<pid>/mem needs PTRACE_MODE_ATTACH permission, but does NOT
// require actually attaching - so the target is never stopped or perturbed.
// Same-uid + kernel.yama.ptrace_scope=0 is sufficient.
const fs = require('fs');

class ProcMemory {
	constructor(pid) {
		this.pid = pid;
		this.fd = fs.openSync(`/proc/${pid}/mem`, 'r');
		this._modules = null;
	}

	close() {
		if (this.fd !== undefined) fs.closeSync(this.fd);
		this.fd = undefined;
	}

	/** ReadProcessMemory equivalent. `address` may be Number or BigInt. */
	read(address, length) {
		const buf = Buffer.alloc(length);
		const pos = typeof address === 'bigint' ? Number(address) : address;
		let got = 0;
		while (got < length) {
			// Short reads happen at page boundaries between mapped regions.
			const n = fs.readSync(this.fd, buf, got, length - got, pos + got);
			if (n <= 0) break;
			got += n;
		}
		if (got < length) throw new Error(`short read at 0x${pos.toString(16)}: ${got}/${length}`);
		return buf;
	}

	readU8(a) { return this.read(a, 1).readUInt8(0); }
	readU16(a) { return this.read(a, 2).readUInt16LE(0); }
	readU32(a) { return this.read(a, 4).readUInt32LE(0); }
	readU64(a) { return Number(this.read(a, 8).readBigUInt64LE(0)); }

	readCString(address, max = 256) {
		const buf = this.read(address, max);
		const end = buf.indexOf(0);
		return buf.slice(0, end === -1 ? max : end).toString('latin1');
	}

	/**
	 * Module list from /proc/<pid>/maps. A module's base is the lowest mapping
	 * of its backing file, which is what GetModuleInformation reports on Windows.
	 */
	modules() {
		if (this._modules) return this._modules;
		const raw = fs.readFileSync(`/proc/${this.pid}/maps`, 'utf8');
		const byPath = new Map();

		for (const line of raw.split('\n')) {
			if (!line) continue;
			const m = line.match(/^([0-9a-f]+)-([0-9a-f]+)\s+(\S+)\s+\S+\s+\S+\s+\S+\s+(.*)$/);
			if (!m) continue;
			const [, startHex, endHex, perms, path] = m;
			const p = path.trim();
			if (!p || p.startsWith('[')) continue;

			const start = parseInt(startHex, 16);
			const end = parseInt(endHex, 16);
			const entry = byPath.get(p) || { path: p, name: p.split('/').pop(), base: start, end, perms: new Set() };
			entry.base = Math.min(entry.base, start);
			entry.end = Math.max(entry.end, end);
			entry.perms.add(perms);
			byPath.set(p, entry);
		}

		this._modules = [...byPath.values()].map((e) => ({
			...e,
			size: e.end - e.base,
			perms: [...e.perms].join(','),
		}));
		return this._modules;
	}

	findModule(nameOrRegex) {
		const re = nameOrRegex instanceof RegExp ? nameOrRegex : new RegExp(`^${nameOrRegex}$`, 'i');
		return this.modules().find((m) => re.test(m.name)) || null;
	}

	/** Parses the PE export table - proves we can walk real structures, not just read bytes. */
	peExports(base) {
		if (this.read(base, 2).toString('latin1') !== 'MZ') return null;
		const peOff = base + this.readU32(base + 0x3c);
		if (this.read(peOff, 4).toString('latin1').replace(/\0/g, '') !== 'PE') return null;

		const optOff = peOff + 24;
		const magic = this.readU16(optOff);
		const plus = magic === 0x20b; // PE32+ = 64-bit
		const dataDir = optOff + (plus ? 112 : 96);

		const exportRva = this.readU32(dataDir);
		if (!exportRva) return { plus, count: 0, names: [], symbols: new Map() };

		const ed = base + exportRva;
		const dllName = this.readCString(base + this.readU32(ed + 12));
		const numNames = this.readU32(ed + 24);
		const funcsRva = this.readU32(ed + 28);
		const namesRva = this.readU32(ed + 32);
		const ordsRva = this.readU32(ed + 36);

		const names = [];
		const symbols = new Map();
		for (let i = 0; i < Math.min(numNames, 8000); i++) {
			const name = this.readCString(base + this.readU32(base + namesRva + i * 4), 128);
			names.push(name);
			// name -> ordinal -> function RVA
			const ordinal = this.readU16(base + ordsRva + i * 2);
			symbols.set(name, base + this.readU32(base + funcsRva + ordinal * 4));
		}
		return { plus, dllName, count: numNames, names, symbols };
	}

	/** Sorted mapped ranges, for sanity-checking that a pointer is plausible. */
	ranges() {
		if (this._ranges) return this._ranges;
		const raw = fs.readFileSync(`/proc/${this.pid}/maps`, 'utf8');
		const out = [];
		for (const line of raw.split('\n')) {
			const m = line.match(/^([0-9a-f]+)-([0-9a-f]+)\s+(\S+)/);
			if (!m) continue;
			if (m[3][0] !== 'r') continue; // unreadable regions can't hold anything we can chase
			out.push([parseInt(m[1], 16), parseInt(m[2], 16)]);
		}
		out.sort((a, b) => a[0] - b[0]);
		this._ranges = out;
		return out;
	}

	isMapped(addr) {
		if (!addr || addr < 0x10000) return false;
		const r = this.ranges();
		let lo = 0,
			hi = r.length - 1;
		while (lo <= hi) {
			const mid = (lo + hi) >> 1;
			if (addr < r[mid][0]) hi = mid - 1;
			else if (addr >= r[mid][1]) lo = mid + 1;
			else return true;
		}
		return false;
	}
}

/** Finds Wine PE processes by their comm name (e.g. "Hearthstone.exe"). */
function findWineProcesses(pattern) {
	const re = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
	const out = [];
	for (const pid of fs.readdirSync('/proc')) {
		if (!/^\d+$/.test(pid)) continue;
		let comm;
		try {
			comm = fs.readFileSync(`/proc/${pid}/comm`, 'utf8').trim();
		} catch {
			continue;
		}
		if (!re.test(comm)) continue;
		// Only real PE processes: must have PE modules mapped.
		let maps = '';
		try {
			maps = fs.readFileSync(`/proc/${pid}/maps`, 'utf8');
		} catch {
			continue;
		}
		if (!/\.(dll|exe)\s*$/im.test(maps)) continue;
		out.push({ pid: Number(pid), comm });
	}
	return out;
}

module.exports = { ProcMemory, findWineProcesses };

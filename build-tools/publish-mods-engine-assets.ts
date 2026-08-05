/**
 * Prepares and uploads BepInEx x64 engine assets + unstripped corlibs
 * (HsMod BCL + Managed overlays from the live Hearthstone install).
 *
 * Usage:
 *   npx ts-node build-tools/publish-mods-engine-assets.ts [--upload] [--hs-path=D:/Games/Hearthstone]
 *
 * Without --upload, assets are staged under build-tools/.mods-engine-staging/
 * With --upload, pushes to s3://static.zerotoheroes.com/mods/ (requires AWS credentials)
 *
 * Note: do not use unity.bepinex.dev/corlibs/6000.3.x for Windows Mono — that profile
 * requires System.Native and crashes BepInEx.Preloader. HsMod UnstrippedCorlib works.
 */
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';

/** Script directory (works under both CJS ts-node and ESM loaders). */
const SCRIPT_DIR = path.resolve(process.cwd(), 'build-tools');

const BUCKET = 'static.zerotoheroes.com';
const MODS_PREFIX = 'mods';
const BEPINEX_VERSION = '5.4.23.5';
const BEPINEX_X64_URL = `https://github.com/BepInEx/BepInEx/releases/download/v${BEPINEX_VERSION}/BepInEx_win_x64_${BEPINEX_VERSION}.zip`;
const HSMOD_CORLIBS_REPO = 'https://github.com/Pik-4/HsMod.git';
const HSMOD_CORLIBS_BRANCH = 'bepinex5';
const HSMOD_CORLIBS_SUBDIR = 'HsMod/UnstrippedCorlib';

/** Full unstripped corlib set used by HsMod (required for BepInEx on Hearthstone). */
const UNSTRIPPED_LIBS = [
	'mscorlib.dll',
	'Mono.Security.dll',
	'System.Core.dll',
	'System.dll',
	'UniTask.dll',
	'Microsoft.CSharp.dll',
	'Mono.Posix.dll',
	'netstandard.dll',
	'Newtonsoft.Json.dll',
	'System.Configuration.dll',
	'System.Data.dll',
	'System.Net.Http.dll',
	'System.Numerics.dll',
	'System.Runtime.Serialization.dll',
	'System.Security.dll',
	'System.Xml.dll',
	'System.Xml.Linq.dll',
	'UniTask.Linq.dll',
];

/** Game-specific assemblies not in Unity BCL corlib zips (prefer HS Managed, else HsMod). */
const GAME_SPECIFIC_LIBS = ['UniTask.dll', 'UniTask.Linq.dll', 'Newtonsoft.Json.dll'];

const ENGINE_CONFIG = {
	x86: {
		bepInExZip: `https://static.zerotoheroes.com/mods/BepInEx_win_x86_${BEPINEX_VERSION}.zip`,
		unstrippedCorlibsBaseUrl: 'https://static.zerotoheroes.com/mods/unstripped_corlibs',
	},
	x64: {
		bepInExZip: `https://static.zerotoheroes.com/mods/BepInEx_win_x64_${BEPINEX_VERSION}.zip`,
		unstrippedCorlibsBaseUrl: 'https://static.zerotoheroes.com/mods/unstripped_corlibs_x64',
	},
	unstrippedLibs: UNSTRIPPED_LIBS,
	doorstopConfigUrl: 'https://static.zerotoheroes.com/mods/doorstop_config.ini',
};

const STAGING_DIR = path.join(SCRIPT_DIR, '.mods-engine-staging');

const args = process.argv.slice(2);
const shouldUpload = args.includes('--upload');
const hsPathArg =
	args.find((a) => a.startsWith('--hs-path='))?.split('=')[1] ??
	(() => {
		const idx = args.indexOf('--hs-path');
		return idx >= 0 ? args[idx + 1] : undefined;
	})();

async function downloadFile(url: string, destPath: string): Promise<void> {
	await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
	return new Promise((resolve, reject) => {
		const protocol = url.startsWith('https') ? https : http;
		const request = protocol.get(url, (response) => {
			if (response.statusCode === 301 || response.statusCode === 302) {
				const redirect = response.headers.location;
				if (redirect) {
					downloadFile(redirect, destPath).then(resolve).catch(reject);
					return;
				}
			}
			if (response.statusCode !== 200) {
				reject(new Error(`Download failed ${response.statusCode} for ${url}`));
				return;
			}
			const file = fs.createWriteStream(destPath);
			response.pipe(file);
			file.on('finish', () => {
				file.close();
				resolve();
			});
			file.on('error', reject);
		});
		request.on('error', reject);
	});
}

function ensureHsModCorlibs(): string {
	const hsmodDir = path.join(STAGING_DIR, 'HsMod-corlibs');
	const corlibSrc = path.join(hsmodDir, HSMOD_CORLIBS_SUBDIR);
	if (!fs.existsSync(corlibSrc)) {
		console.log('Cloning HsMod for unstripped corlibs', HSMOD_CORLIBS_BRANCH);
		fs.rmSync(hsmodDir, { recursive: true, force: true });
		execSync(`git clone --depth 1 --branch ${HSMOD_CORLIBS_BRANCH} ${HSMOD_CORLIBS_REPO} "${hsmodDir}"`, {
			stdio: 'inherit',
		});
	}
	return corlibSrc;
}

/**
 * Stage x64 unstripped corlibs: HsMod Mono BCL + game-specific overlays from live Managed.
 * unity.bepinex.dev/corlibs/6000.3.x requires System.Native and crashes BepInEx.Preloader
 * on Windows Mono; HsMod UnstrippedCorlib works on Unity 6000.3.
 */
async function stageX64Corlibs(hsInstallPath: string | undefined): Promise<string> {
	const outDir = path.join(STAGING_DIR, 'unstripped_corlibs_x64');
	await fs.promises.rm(outDir, { recursive: true, force: true });
	await fs.promises.mkdir(outDir, { recursive: true });

	const hsmodSrc = ensureHsModCorlibs();
	const managedDir = hsInstallPath ? path.join(hsInstallPath, 'Hearthstone_Data', 'Managed') : null;
	if (!managedDir || !fs.existsSync(managedDir)) {
		throw new Error(
			`Hearthstone Managed folder required for Unity 6000.3 overlays (pass --hs-path). Tried: ${managedDir}`,
		);
	}

	for (const lib of UNSTRIPPED_LIBS) {
		const dest = path.join(outDir, lib);
		const fromManaged = GAME_SPECIFIC_LIBS.includes(lib) ? path.join(managedDir, lib) : null;
		const fromHsMod = path.join(hsmodSrc, lib);

		let src: string | null = null;
		if (fromManaged && fs.existsSync(fromManaged)) {
			src = fromManaged;
		} else if (fs.existsSync(fromHsMod)) {
			src = fromHsMod;
		}

		if (!src) {
			throw new Error(`Could not resolve corlib ${lib}`);
		}
		await fs.promises.copyFile(src, dest);
		console.log(`Staged ${lib} from ${src}`);
	}

	return outDir;
}

async function stageBepInExX64(): Promise<string> {
	const zipPath = path.join(STAGING_DIR, `BepInEx_win_x64_${BEPINEX_VERSION}.zip`);
	console.log('Downloading BepInEx x64', BEPINEX_X64_URL);
	await downloadFile(BEPINEX_X64_URL, zipPath);
	return zipPath;
}

async function uploadFile(localPath: string, s3Key: string): Promise<void> {
	const s3 = new S3Client({ region: 'us-west-2' });
	const body = fs.readFileSync(localPath);
	await new Upload({
		client: s3,
		params: {
			Bucket: BUCKET,
			Key: s3Key,
			Body: body,
			ACL: 'public-read',
			ContentType: s3Key.endsWith('.zip')
				? 'application/zip'
				: s3Key.endsWith('.json')
					? 'application/json'
					: s3Key.endsWith('.ini')
						? 'text/plain'
						: 'application/octet-stream',
		},
	}).done();
	console.log(`Uploaded s3://${BUCKET}/${s3Key} (${(body.length / 1024).toFixed(1)} KB)`);
}

async function uploadDirectory(localDir: string, s3Prefix: string): Promise<void> {
	const files = await fs.promises.readdir(localDir);
	for (const file of files) {
		const localPath = path.join(localDir, file);
		const stat = await fs.promises.stat(localPath);
		if (!stat.isFile()) {
			continue;
		}
		await uploadFile(localPath, `${s3Prefix}/${file}`);
	}
}

async function main(): Promise<void> {
	await fs.promises.rm(STAGING_DIR, { recursive: true, force: true });
	await fs.promises.mkdir(STAGING_DIR, { recursive: true });

	const corlibsDir = await stageX64Corlibs(hsPathArg);
	const bepinexZip = await stageBepInExX64();

	const engineOnlyConfig = {
		engine: ENGINE_CONFIG,
	};
	const engineConfigPath = path.join(STAGING_DIR, 'mods-engine-config.json');
	await fs.promises.writeFile(engineConfigPath, JSON.stringify(engineOnlyConfig, null, 2));
	console.log('Wrote staging config', engineConfigPath);

	if (!shouldUpload) {
		console.log('\nStaging complete (no upload). Re-run with --upload to push to S3.');
		console.log('BepInEx zip:', bepinexZip);
		console.log('x64 corlibs:', corlibsDir);
		return;
	}

	const doorstopConfigPath = path.join(SCRIPT_DIR, 'doorstop_config.ini');
	await uploadFile(doorstopConfigPath, `${MODS_PREFIX}/doorstop_config.ini`);
	await uploadFile(bepinexZip, `${MODS_PREFIX}/BepInEx_win_x64_${BEPINEX_VERSION}.zip`);
	await uploadDirectory(corlibsDir, `${MODS_PREFIX}/unstripped_corlibs_x64`);
	console.log('\nUpload complete. Update mods-config.json engine block (mods-backend lambda).');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

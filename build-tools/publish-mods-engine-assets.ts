/**
 * Prepares and uploads BepInEx x64 engine assets + refreshes mods-config.json engine block.
 *
 * Usage:
 *   npx ts-node build-tools/publish-mods-engine-assets.ts [--upload] [--hs-path "E:/Games/Hearthstone"]
 *
 * Without --upload, assets are staged under build-tools/.mods-engine-staging/
 * With --upload, pushes to s3://static.zerotoheroes.com/mods/ (requires AWS credentials)
 */
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';

const BUCKET = 'static.zerotoheroes.com';
const MODS_PREFIX = 'mods';
const BEPINEX_VERSION = '5.4.23.5';
const BEPINEX_X64_URL = `https://github.com/BepInEx/BepInEx/releases/download/v${BEPINEX_VERSION}/BepInEx_win_x64_${BEPINEX_VERSION}.zip`;
const HSMOD_CORLIBS_REPO = 'https://github.com/Pik-4/HsMod.git';
const HSMOD_CORLIBS_BRANCH = 'bepinex5';
const HSMOD_CORLIBS_SUBDIR = 'HsMod/UnstrippedCorlib';

/** Full unstripped corlib set used by HsMod (required for stable BepInEx on Hearthstone). */
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

const STAGING_DIR = path.join(__dirname, '.mods-engine-staging');

const args = process.argv.slice(2);
const shouldUpload = args.includes('--upload');
const hsPathArg = args.find((a) => a.startsWith('--hs-path='))?.split('=')[1];

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

async function stageX64Corlibs(_hsInstallPath: string | undefined): Promise<string> {
	const outDir = path.join(STAGING_DIR, 'unstripped_corlibs_x64');
	await fs.promises.rm(outDir, { recursive: true, force: true });
	await fs.promises.mkdir(outDir, { recursive: true });

	const hsmodDir = path.join(STAGING_DIR, 'HsMod-corlibs');
	const corlibSrc = path.join(hsmodDir, HSMOD_CORLIBS_SUBDIR);
	if (!fs.existsSync(corlibSrc)) {
		console.log('Cloning HsMod for unstripped corlibs', HSMOD_CORLIBS_BRANCH);
		const { execSync } = require('child_process') as typeof import('child_process');
		await fs.promises.rm(hsmodDir, { recursive: true, force: true });
		execSync(`git clone --depth 1 --branch ${HSMOD_CORLIBS_BRANCH} ${HSMOD_CORLIBS_REPO} "${hsmodDir}"`, {
			stdio: 'inherit',
		});
	}

	for (const lib of UNSTRIPPED_LIBS) {
		const src = path.join(corlibSrc, lib);
		if (!fs.existsSync(src)) {
			throw new Error(`Missing ${lib} in ${corlibSrc}`);
		}
		await fs.promises.copyFile(src, path.join(outDir, lib));
		console.log(`Staged ${lib}`);
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
			ContentType: s3Key.endsWith('.zip') ? 'application/zip' : 'application/octet-stream',
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

	const doorstopConfigPath = path.join(__dirname, 'doorstop_config.ini');
	await uploadFile(doorstopConfigPath, `${MODS_PREFIX}/doorstop_config.ini`);
	await uploadFile(bepinexZip, `${MODS_PREFIX}/BepInEx_win_x64_${BEPINEX_VERSION}.zip`);
	await uploadDirectory(corlibsDir, `${MODS_PREFIX}/unstripped_corlibs_x64`);
	console.log(
		'\nUpload complete. Update mods-config.json via mods-backend lambda (engine block is static in lambda).',
	);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

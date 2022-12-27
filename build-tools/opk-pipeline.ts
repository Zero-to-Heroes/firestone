import 'reflect-metadata';
import { OwCliContainer, SignOpkCommand, UploadOpkCommand } from '@overwolf/ow-cli/bin';
import { PackOpkCommand } from '@overwolf/ow-cli/bin/commands/opk/pack-opk.command';
import { readFile } from 'fs/promises';

const pipeline = async () => {
	OwCliContainer.init();

	console.log('[opk] reading current version');
	const manifestBuff = await readFile('./dist/apps/legacy/manifest.json');
	const manifestJson = JSON.parse(manifestBuff.toString('utf8'));
	const appVersion = manifestJson.meta.version;
	console.log('[opk] current version is', appVersion);

	const fileName = `Firestone_${appVersion}.opk`;
	const signedFileName = `Firestone_${appVersion}_signed.opk`;

	console.log('[opk] packing opk to', fileName);
	const packOpkCommand = OwCliContainer.resolve(PackOpkCommand);
	await packOpkCommand.handler({
		folderPath: 'dist/apps/legacy',
		outputFile: fileName,
	});

	console.log('[opk] signing opk to', signedFileName);
	const signOpkCmd = OwCliContainer.resolve(SignOpkCommand);
	await signOpkCmd.handler({
		filePath: `./${fileName}`,
		outputPath: `./${signedFileName}`,
	});

	console.log('[opk] uploading opk');
	const uploadOpkCmd = OwCliContainer.resolve(UploadOpkCommand);
	const newVersionId = await uploadOpkCmd.handler({
		filePath: `./${signedFileName}`,
		channelId: 24, // beta
		wait: true,
	});
	console.log('[opk] new version id', newVersionId);
};

pipeline();

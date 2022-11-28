// https://github.com/Stuk/jszip/issues/386
import { createReadStream, createWriteStream } from 'fs';
import { readdir, stat } from 'fs/promises';
import JSZip from 'jszip';
import { basename, dirname, resolve, sep } from 'path';

/**
 * Returns a flat list of all files and subfolders for a directory (recursively).
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
const getFilePathsRecursively = async (dir: string): Promise<string[]> => {
	// returns a flat array of absolute paths of all files recursively contained in the dir
	const list = await readdir(dir);
	const statPromises = list.map(async (file: string) => {
		const fullPath = resolve(dir, file);
		const theStat = await stat(fullPath);
		if (theStat && theStat.isDirectory()) {
			return getFilePathsRecursively(fullPath);
		}
		return fullPath;
	});

	return (await Promise.all(statPromises)).flatMap((path) => path);
};

/**
 * Creates an in-memory zip stream from a folder in the file system
 * @param {string} dir
 * @returns {JSZip}
 */
const createZipFromFolder = async (dir: string): Promise<JSZip> => {
	const absRoot = resolve(dir);
	const filePaths = await getFilePathsRecursively(dir);
	return filePaths.reduce((z: JSZip, filePath: string) => {
		const relative = filePath.replace(absRoot, '');
		// create folder trees manually
		const zipFolder: JSZip = dirname(relative)
			.split(sep)
			.reduce((zf, dirName) => zf.folder(dirName) as JSZip, z);

		zipFolder.file(basename(filePath), createReadStream(filePath));
		return z;
	}, new JSZip());
};

/**
 * Compresses a folder to the specified zip file.
 * @param {string} srcDir
 * @param {string} destFile
 */
export const compressFolder = async (srcDir: string, destFile: string) => {
	const start = Date.now();
	try {
		const zip = await createZipFromFolder(srcDir);
		zip.generateNodeStream({ streamFiles: true, compression: 'DEFLATE' })
			.pipe(createWriteStream(destFile))
			.on('error', (err) => console.error('Error writing file', err.stack))
			.on('finish', () => console.log('Zip written successfully:', Date.now() - start, 'ms'));
	} catch (ex) {
		console.error('Error creating zip', ex);
	}
};

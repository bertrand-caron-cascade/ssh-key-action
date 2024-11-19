import * as fs from "fs";
import * as path from "path";

import * as common from "./common";

try {
    post();
} catch (err) {
    console.warn('Ignoring error during post step:');
    console.warn(err);
}

/**
 * cleanup function
 */
export function post(): void {
    const sshDirName = common.getSshDirectory();
    const backupSuffix = common.getBackupSuffix();
    if (backupSuffix === "") {
        // remove ".ssh" directory if suffix is not set
        removeDirectory(sshDirName);
        console.log(`✅SSH directory "${sshDirName}" has been removed successfully.`);
    } else {
        // remove created files and restore from backup
        const removedFileNames = removeCreatedFiles(sshDirName);
        if (removedFileNames.length > 0) {
            console.log(`✅Following files have been removed successfully; ${removedFileNames.join(", ")}`);
        }

        const restoredFileNames = restoreFiles(sshDirName, backupSuffix);
        if (restoredFileNames.length > 0) {
            console.log(`✅Following files in suffix "${backupSuffix}" have been restored successfully; ${restoredFileNames.join(", ")}`);
        }
    }
}

/**
 * remove directory
 * @param dirName directory name to remove
 */
function removeDirectory(dirName: string): void {
    try {
        fs.rmSync(dirName, {
            recursive: true,
            force: true,
        });
    } catch (error: unknown) {
        console.warn(`Could not delete directory: '${dirName}'`);
        console.warn('Error was:');
        console.warn(error);
    }

}

/**
 * remove created files in main phase
 * @param dirName directory name
 * @returns removed file names
 */
function removeCreatedFiles(dirName: string): string[] {
    const createdFileNames = common.loadCreatedFileNames();
    for (const fileName of createdFileNames) {
        const pathName = path.join(dirName, fileName);
        try {
            fs.rmSync(pathName);
        } catch (error: unknown) {
            console.warn(`Could not delete file: '${pathName}'`);
            console.warn('Error was:');
            console.warn(error);
        }
    }
    return createdFileNames;
}

/**
 * restore files from backups
 * @param dirName directory name
 * @param backupSuffix suffix of backup directory
 * @returns restored file names
 */
function restoreFiles(dirName: string, backupSuffix: string): string[] {
    const restoredFileNames: string[] = [];
    const entries = fs.readdirSync(dirName)
        .filter((entry) => {
            // skip if not a backed-up file
            return entry.endsWith(backupSuffix);
        });

    for (const entry of entries) {
        const entryOrg = entry.substring(0, entry.length - backupSuffix.length);
        const pathNameOrg = path.join(dirName, entryOrg);
        const pathNameBak = path.join(dirName, entry);

        fs.renameSync(pathNameBak, pathNameOrg);
        restoredFileNames.push(entryOrg);
    }
    return restoredFileNames;
}

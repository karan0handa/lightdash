import { DbtManifest, DbtManifestVersion } from '@lightdash/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import globalState from '../globalState';
import { getDbtVersion } from '../handlers/dbt/getDbtVersion';

type LoadManifestArgs = {
    targetDir: string;
};

export const getDbtManifest = async (): Promise<DbtManifestVersion> => {
    const version = await getDbtVersion();
    if (version.startsWith('1.3.')) return DbtManifestVersion.V7;
    if (version.startsWith('1.5.')) return DbtManifestVersion.V9;
    if (version.startsWith('1.6.')) return DbtManifestVersion.V10;
    return DbtManifestVersion.V8;
};

export const getManifestPath = async (targetDir: string): Promise<string> =>
    path.join(targetDir, 'manifest.json');

export const loadManifest = async ({
    targetDir,
}: LoadManifestArgs): Promise<DbtManifest> => {
    const filename = await getManifestPath(targetDir);
    globalState.debug(`> Loading dbt manifest from ${filename}`);
    try {
        const manifest = JSON.parse(
            await fs.readFile(filename, { encoding: 'utf-8' }),
        ) as DbtManifest;
        return manifest;
    } catch (err: any) {
        throw new Error(
            `Could not load manifest from ${filename}:\n  ${err.message}`,
        );
    }
};

import { Context } from '@actions/github/lib/context';
import { Octokit } from '@octokit/rest';
import semver from 'semver';
import winston from 'winston';

import { PullRequest } from './PullRequest';
import { IVersions } from './IVersions';
import { VersionInfo } from './VersionInfo';
import { ITags } from './ITags';

export class Versions implements IVersions {
    constructor(readonly _octokit: Octokit, readonly _context: Context, readonly _tags: ITags, readonly _logger: winston.Logger) {
    }

    async getNextVersionFor(pullRequest: PullRequest): Promise<VersionInfo> {

        let isMinor = false;
        let isPatch = false;
        const isMajor = pullRequest.labels.some(_ => _.name === 'major');
        if (!isMajor) {
            isMinor = pullRequest.labels.some(_ => _.name === 'minor');
            if (!isMinor) {
                isPatch = pullRequest.labels.some(_ => _.name === 'patch');
            }
        }

        if (!isMajor && !isMinor && !isPatch) {
            this._logger.info('No release related labels associated with the PR.');
            if (pullRequest.labels.length > 0) {
                this._logger.info('Labels associated with PR:');
                pullRequest.labels.forEach(_ => this._logger.info(`  - ${_.name}`));
            }

            return VersionInfo.noRelease;
        }

        let latestTag = await this._tags.getLatestTag(
            this._context.repo.owner,
            this._context.repo.repo,
            true,
            'v',
            '',
            true);

        if (latestTag.toLowerCase().startsWith('v')) {
            latestTag = latestTag.substring(1);
        } else {
            latestTag = 'v0.0.0';
            this._logger.info('No valid version found in tags - setting to v0.0.0');
        }

        this._logger.info(`Latest tag: ${latestTag}`);

        let version = semver.parse(latestTag);
        if (!version) {
            this._logger.error(`Version string '${latestTag}' is not in a valid format`);
            return VersionInfo.invalid;
        }
        if (isMajor) version = version.inc('major') || version;
        if (isMinor) version = version.inc('minor') || version;
        if (isPatch) version = version.inc('patch') || version;

        this._logger.info(`New version is '${version.version}''`);

        return new VersionInfo(version, isMajor, isMinor, isPatch, true, true);
    }
}
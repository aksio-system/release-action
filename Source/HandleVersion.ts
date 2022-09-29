import { context } from '@actions/github';
import { Octokit } from '@octokit/rest';

import { logger } from './logging';

import inputs from './inputs';
import outputs from './outputs';
import { IPullRequests } from './IPullRequests';
import { PullRequests } from './PullRequests';
import { IVersions } from './IVersions';
import { Versions } from './Versions';
import { Tags } from './Tags';

const octokit = new Octokit({ auth: inputs.gitHubToken });

export class HandleVersion {

    constructor(readonly _pullRequests: IPullRequests, readonly _versions: IVersions) {
    }

    async run(): Promise<void> {
        try {
            const pullRequest = await this._pullRequests.getMergedPullRequest();
            if (!pullRequest) {
                logger.error('No merged PR found.');
                return;
            }
            if (!pullRequest.labels || pullRequest.labels.length === 0) {
                logger.info('No release labels found.');
                if (pullRequest.labels.length > 0) {
                    logger.info('Labels associated with PR:');
                    pullRequest.labels.forEach(_ => logger.info(`  - ${_}`));
                }
                outputs.setShouldPublish(false);
                return;
            }

            const version = await this._versions.getNextVersionFor(pullRequest);
            if (!version) return;

            outputs.setVersion(version.version.version);
            outputs.setShouldPublish(true);
        } catch (ex) {
            logger.error("Something went wrong");
            logger.error(ex);

            outputs.setShouldPublish(false);
        }
    }
}

new HandleVersion(
    new PullRequests(octokit, context, logger),
    new Versions(octokit, context, new Tags(octokit, context, logger), logger)).run();

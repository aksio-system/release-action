import { Versions } from '../Versions';
import sinon from 'sinon';
import { PullRequest } from '../PullRequest';
import fakeLogger from '../fakeLogger';
import { ITags } from '../ITags';
import { a_closed_event } from './given/a_closed_event';

describe("when getting next version and latest tag is a valid semver and there are no labels and trigger event was closed", async () => {
    const fakeTags: ITags = {
        getLatestTag: sinon.stub().returns('6.4.0')
    };

    const context = new a_closed_event();

    const versions = new Versions(sinon.stub() as any, context.context, fakeTags, fakeLogger);
    const pullRequest: PullRequest = {
        labels: [],
        body: '',
        url: '',
        html_url: '',
        number: 42,
        base: { ref: '' },
        head: { ref: '' }
    };

    const version = await versions.getNextVersionFor(pullRequest);

    it('should set is release to false', () => version.isRelease.should.be.false);
    it('should set is is valid to true', () => version.isValid.should.be.true);
    it('should not be a prerelease', () => version.isPrerelease.should.be.false);
});


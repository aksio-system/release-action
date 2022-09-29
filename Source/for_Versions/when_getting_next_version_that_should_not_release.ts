import { Versions } from '../Versions';
import sinon from 'sinon';
import { PullRequest } from '../PullRequest';
import fakeLogger from '../fakeLogger';
import fakeContext from '../fakeContext';
import { ITags } from '../ITags';

describe("when getting next version that should not release", async () => {
    const fakeTags: ITags = {
        getLatestTag: sinon.stub().returns('v1.0.0')
    };

    Object.defineProperty(fakeContext, "eventName", {
        get: () => {
            return 'closed';
        }
    });

    const versions = new Versions(sinon.stub() as any, fakeContext, fakeTags, fakeLogger);
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
    it('should not be a prerelease', () => version.isPreRelease.should.be.false);
});

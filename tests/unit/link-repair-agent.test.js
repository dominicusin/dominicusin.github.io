/**
 * Unit tests for src/agents/link-repair-agent.js (plan Phase 4.1 — raise the
 * 0% coverage). The module imports octokit/glob/fs; we mock those so the
 * algorithmic logic is tested in isolation: link-type classification,
 * Levenshtein similarity, confidence scoring, PR-body generation, and the
 * internal-link resolution path (with a mocked fs).
 */
jest.mock('@octokit/rest', () => ({
  Octokit: class { constructor() {} }
}), { virtual: true });
jest.mock('glob', () => ({ glob: jest.fn() }));
jest.mock('fs/promises', () => ({ readFile: jest.fn(), access: jest.fn() }));

import { LinkRepairAgent } from '../../src/agents/link-repair-agent.js';
import fs from 'fs/promises';
import { glob } from 'glob';

describe('LinkRepairAgent — pure logic', () => {
  let agent;
  beforeEach(() => { agent = new LinkRepairAgent({ owner: 'o', repo: 'r' }); });

  test('getLinkType classifies links', () => {
    expect(agent.getLinkType('/abs/path')).toBe('internal-absolute');
    expect(agent.getLinkType('http://x.com')).toBe('external');
    expect(agent.getLinkType('./rel')).toBe('internal-relative');
    expect(agent.getLinkType('../up')).toBe('internal-relative');
    expect(agent.getLinkType('weird')).toBe('internal-unknown');
  });

  test('levenshteinDistance correctness', () => {
    expect(agent.levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(agent.levenshteinDistance('', 'abc')).toBe(3);
    expect(agent.levenshteinDistance('same', 'same')).toBe(0);
  });

  test('calculateStringSimilarity is 1 for identical, <1 for different', () => {
    expect(agent.calculateStringSimilarity('abc', 'abc')).toBe(1);
    expect(agent.calculateStringSimilarity('abc', 'xyz')).toBeLessThan(1);
    expect(agent.calculateStringSimilarity('', '')).toBe(1);
  });

  test('calculateConfidence adds bonuses, capped at 1.0', () => {
    const link = { link: 'post.md' };
    const s1 = { path: 'post.md', similarity: 0.5 };
    const c1 = agent.calculateConfidence(link, s1); // same ext + same dir bonus
    expect(c1).toBeGreaterThan(0.5);
    const s2 = { path: 'other.txt', similarity: 0.99 };
    expect(agent.calculateConfidence(link, s2)).toBe(1.0); // capped
  });

  test('generatePRBody renders summary + table', () => {
    agent.brokenLinks = [{ link: 'a' }];
    const body = agent.generatePRBody([
      { file: 'f.md', oldLink: 'a', newLink: 'b', confidence: 0.8 }
    ]);
    expect(body).toContain('Automated Link Repair');
    expect(body).toContain('f.md');
    expect(body).toContain('80%');
  });

  test('createPullRequest returns null with no fixes', async () => {
    expect(await agent.createPullRequest()).toBeNull();
  });
});

describe('LinkRepairAgent — internal link resolution (mocked fs)', () => {
  let agent;
  beforeEach(() => {
    agent = new LinkRepairAgent({ owner: 'o', repo: 'r', baseBranch: 'main' });
  });

  test('checkInternalLink true when file exists', async () => {
    fs.access.mockResolvedValueOnce(undefined);
    expect(await agent.checkInternalLink('foo.md', 'posts/index.md')).toBe(true);
  });

  test('checkInternalLink tries alternate extensions then false', async () => {
    fs.access
      .mockRejectedValueOnce(new Error('no'))
      .mockRejectedValueOnce(new Error('no'))
      .mockRejectedValueOnce(new Error('no'))
      .mockRejectedValueOnce(new Error('no'))
      .mockRejectedValueOnce(new Error('no'))
      .mockRejectedValueOnce(new Error('no'));
    expect(await agent.checkInternalLink('foo', 'posts/index.md')).toBe(false);
  });

  test('checkInternalLink resolves relative path', async () => {
    fs.access.mockResolvedValueOnce(undefined);
    const res = await agent.checkInternalLink('./bar.md', 'posts/index.md');
    expect(res).toBe(true);
  });
});

describe('LinkRepairAgent — scan (mocked glob + fs)', () => {
  let agent;
  beforeEach(() => {
    agent = new LinkRepairAgent({ owner: 'o', repo: 'r' });
  });

  test('scanForBrokenLinks parses markdown links and uses checkLink', async () => {
    glob.mockResolvedValueOnce(['posts/a.md']);
    fs.readFile.mockResolvedValueOnce('# Title\n[good](http://ok.com)\n[bad](http://bad.com)\n[anchor](#sec)\n');
    // external: ok -> true, bad -> false (fetch mocked below)
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, status: 404 });
    const broken = await agent.scanForBrokenLinks();
    expect(broken).toHaveLength(1);
    expect(broken[0].link).toBe('http://bad.com');
    expect(broken[0].type).toBe('external');
  });

  test('scan skips mailto/tel/anchor links', async () => {
    glob.mockResolvedValueOnce(['p.md']);
    fs.readFile.mockResolvedValueOnce('[m](mailto:a@b.com)\n[t](tel:123)\n[#](x#y)\n');
    const broken = await agent.scanForBrokenLinks();
    expect(broken).toHaveLength(0);
  });
});

// Compatibility shim: legacy unit tests import { describe, it, expect, ... }
// from '../test-utils.js'. Re-export Jest's globals so they run under Jest.
export {
  describe,
  it,
  test,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  jest,
  fn,
  spyOn,
  mock
} from '@jest/globals';

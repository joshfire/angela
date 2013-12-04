/**
 * @fileOverview This example illustrates the order of execution of the
 * "describe" and "it" functions in Jasmine.
 *
 * In particular, note that Jasmine does not run the "it" tests of a "describe"
 * immediately but schedule them for later, meaning all "describe" are run
 * first and all "it" only run afterwards.
 *
 * Said differently, one cannot use the "describe" level directly e.g. to load
 * a Web page with a "driver.get" page. One must rather use the "beforeEach"
 * function, possibly linked with a flag scoped at the "describe" level to
 * run the action only once.
 *
 * Ignoring other execution messages reported on the console, this file outputs
 * the following messages:
 *
 *  First suite runs right away.
 *  Second suite runs before tests of other suites are run.
 *  Third suite runs runs before tests of other suites are run.
 *  Fourth suite runs before tests of other suites are run.
 *  First test of first suite runs.
 *  First test of second suite runs.
 *  The beforeEach function of third suite runs before each test.
 *  First test of third suite runs after beforeEach.
 *  The beforeEach function of third suite runs before each test.
 *  Second test of third suite runs after beforeEach.
 *  This beforeEach function of fourth suite runs only before first test.
 *  First test of fourth suite runs after beforeEach.
 *  Second test of fourth suite runs without beforeEach.
 *
 * Run the example with:
 *   angela examples/flow.spec.js
 */
/* global describe, it, expect, console, beforeEach */

describe('first suite', function () {
  console.log('First suite runs right away.');
  it('is true', function () {
    console.log('First test of first suite runs.');
    expect(true).toBeTruthy();
  });
});

describe('second suite', function () {
  console.log('Second suite runs before tests of other suites are run.');
  it('is true', function () {
    console.log('First test of second suite runs.');
    expect(true).toBeTruthy();
  });
});

describe('third suite', function () {
  console.log('Third suite runs runs before tests of other suites are run.');
  beforeEach(function () {
    console.log('The beforeEach function of third suite runs before each test.');
  });
  it('is true', function () {
    console.log('First test of third suite runs after beforeEach.');
    expect(true).toBeTruthy();
  });
  it('is true as well', function () {
    console.log('Second test of third suite runs after beforeEach.');
    expect(true).toBeTruthy();
  });
});

describe('fourth suite', function () {
  console.log('Fourth suite runs before tests of other suites are run.');
  var initialized = false;
  beforeEach(function () {
    if (initialized) return;
    initialized = true;
    console.log('The beforeEach function of fourth suite runs only before first test.');
  });
  it('is true', function () {
    console.log('First test of fourth suite runs after beforeEach.');
    expect(true).toBeTruthy();
  });
  it('is true as well', function () {
    console.log('Second test of fourth suite runs without beforeEach.');
    expect(true).toBeTruthy();
  });
});
# Angela

Angela is a Node.js test runner for [acceptance tests](http://en.wikipedia.org/wiki/Acceptance_testing) written with the [Jasmine](http://jasmine.github.io/2.0/introduction.html) JavaScript testing framework and [Selenium's WebDriverJS](https://code.google.com/p/selenium/wiki/WebDriverJs) implementation of the [WebDriver API](http://www.w3.org/TR/webdriver/). In other words, Angela helps test a Web application from an end user perspective with scenarios such as:

```javascript
describe('Angela', function () {
  it('is very sweet', function (done) {
    driver.get('http://www.urbandictionary.com/define.php?term=Angela');
    driver.getTitle().then(function (title) {
      expect(title).toEqual('Urban Dictionary: Angela');
      done();
    });
  });
});
```

Tests are run in [PhantomJS](http://phantomjs.org/) by default but can equally run in Chrome, Firefox, Opera, Safari or Android thanks to the `--browser` option (some of them are platform-dependent).

Angela sets things up so that you can focus on actually writing tests and not lose time figuring out the libraries to install and the servers to run:

- it starts the right WebDriver server for the targeted Web browser
- it creates the Webdriver session, one for all tests by default or one per suite of tests if so requested
- it exposes the WebDriver instance in test files
- it reports WebDriver errors as test failures


## Installation

To install Angela globally with npm:

```bash
npm install -g angela
angela --help
```

This may take a couple of minutes as Angela includes a few binary files (~50Mb). If you prefer, you can clone the source code to your machine:

```
git clone git@github.com:joshfire/angela.git
cd angela
npm install
```

The `angela` program is an alias to the `lib/runner.js` script in the source code. If you are looking at the source code of the tool and wondering how to run it, just type: `node lib/runner.js --help`.


## Getting started

Install Angela and create a file named `sweet.spec.js` that contains:

```javascript
describe('Angela', function () {
  it('is very sweet', function (done) {
    driver.get('http://www.urbandictionary.com/define.php?term=Angela');
    driver.getTitle().then(function (title) {
      expect(title).toEqual('Urban Dictionary: Angela');
      done();
    });
  });
});
```

Then ask Angela to run the test:

```bash
angela sweet.spec.js
```

After a couple of seconds, you should see something like:

```bash
Running 1 spec tests...

Progress
--------
Angela is very sweet... passed


Summary
-------
1 spec run in 1 second.
no failure.
```


## Usage

Run `angela --help` for usage information. This should output something like:

```bash
Angela - Copyright (c) 2013 Joshfire. All rights reserved.

CLI tool to run Jasmine test suites against a Web application that runs in a
Web browser controlled with WebDriver.

Usage: /Users/fd/bin/angela [path]

Parameters:
  path           Spec file or folder that contains the spec files.
                 Spec file names must end with ".spec.js" or "Spec.js".
                 The tool will recurse through subfolders to list spec files.
                 If no path is given, the tool will search for spec files in
                 current working directory.

Options:
  --browser, -b      Webdriver browser endpoint. The code automatically starts
                     the "right" Webdriver server based on that setting.
                     Possible values include "phantomjs", "chrome", "firefox",
                     "safari", or "android" (provided browser or device is
                     available on your machine).          [default: "phantomjs"]
  --before           JS file to "require" before tests are run. Use this option
                     to add custom matchers or expose additional variables to
                     the global scope as needed. Code must be synchronous.
  --after            JS file to "require" after tests have run. Use this option
                     to run custom code when execution is over. Code must be
                     synchronous.
  --host             Webdriver server host                [default: "localhost"]
  --port             Webdriver server port                       [default: 8195]
  --verbose, -v      Trace Angela's execution to the console    [default: false]
  --serverlog        Log Webdriver server execution to provided log file
                                                                   [default: ""]
  --useserver        Whether to use running Webdriver server or to start one
                                                                [default: false]
  --printerrorstack  Print stack trace when a test fails because of an
                     exception. This makes failure reports potentially quite
                     verbose but can greatly help you track down the origin of
                     the exception.                             [default: false]
  --sessionperspec   Angela uses the same browser session throughout by
                     default. Set the flag to use one browser session per spec.
                     Specs will run considerably slower.        [default: false]
  --keep, -k         Whether to keep the browser open when tests are over
                                                                [default: false]
  --junit            Create JUnit XML reports (in "junitreports" folder)
                                                                [default: false]
  --help, -h         Displays usage help
```

## Execution

When run without parameter or option, Angela lists all files that end with `.spec.js` or `Spec.js` in the current working directory (and its subdirectories), starts a PhantomJS server in the background that exposes a WebDriver endpoint on port `8195` and runs the spec files it found against PhantomJS. It reports the results to the console.

Spec files are run one after the other using the same browser session unless you set the `--sessionperspec` flag (this does slow down execution quite a bit, though).

Set the `path` parameter to the spec file to run or to the folder that contains the spec files to run to override default behavior.

The `--browser` option lets you change the targeted Web browser. Unless you also set the `--userserver` option or set the `--host` option, Angela will try to start the right WebDriver server on your local machine to interact with the targeted Web browser. This may or may not work depending on the operating system you are running:

- The `firefox`, `opera` and `phantomjs` values use the default Selenium standalone server and should work in all sorts of environments provided `java` is available from the command-line.
- The `chrome` value will only work on a Mac. It should be straightforward to check the platform when the tool is run and run the appropriate ChromeDriver, that's just not done at this stage.
- The `safari` value will only work provided a recent version of Safari is available.
- The `android` value will only work provided you have a Linux-based OS (to run the small bash script), Android's SDK `adb` tool in your path, one and only one connected Android device or emulator instance, and that the Android Webdriver server application has been installed onto that device (*)
- Other values (e.g. `internet explorer`) are not supported by Angela, meaning that you need to set the right Webdriver server on your own and tell the tool to use that server with the `--useserver` option.

(*) To install the Android Webdriver server application to the connected device or emulator instance, run the following command from the root folder of Angela:

```bash
adb install drivers/android-server-2.32.0.apk
```

## Spec files

Test files are regular Jasmine spec files. On top of the usual Jasmine functions (`describe`, `it`, `expect`), the spec files can interact with the global `driver` variable to send commands to the running Web browser through WebDriver.

```javascript
describe('The home page of Joshfire.com', function () {
  it('has the right title "Joshfire"', function (done) {
    driver.get('http://joshfire.com')
      .then(function () { return driver.getTitle(); })
      .then(function (title) { expect(title).toEqual('Joshfire'); })
      .then(done);
  });
});
```

Angela ships with [version 2.0 of Jasmine](http://jasmine.github.io/2.0/introduction.html), which introduces a [number of changes](https://github.com/jasmine/jasmine/blob/master/release_notes/20.md#breaking-changes) that ease authoring of asynchronous tests in particular.

The `driver` instance is the one exposed by the [Selenium's WebDriverJS](https://code.google.com/p/selenium/wiki/WebDriverJs) library. Check its documentation for usage. In particular, note the use of *promises* and the fact that WebDriverJS manages the underlying control flow for you, allowing you to write scenarios in a synchronous way if you so wish (as in the [Getting started](#getting-started) example) or using promises all the way down as in the above example.

The closest thing to a useful documentation of methods you can use is [Selenium's Javadoc](http://selenium.googlecode.com/git/docs/api/java/org/openqa/selenium/package-summary.html), starting from the [WebDriver class](http://selenium.googlecode.com/git/docs/api/java/org/openqa/selenium/WebDriver.html#method_summary). Next in line is the [WebDriver W3C Working Draft](http://www.w3.org/TR/webdriver/).

The `examples` folder contains a number of examples to help you get started. To run the above example from the root folder of Angela:

```bash
angela examples/test.spec.js
```

Each test must complete within 30 seconds (or 2 minutes if tests are run on an Android device). That setting cannot be changed for the time being but could easily be exposed in a future version of the tool if that seems useful.


### Custom matchers

If you want to define custom matchers shared by all your test suites, use the `--before` option to target a JS file that defines the matchers with code such as:

```javascript
beforeEach(function () {
  addMatchers({
    toBeSweet: function () {
      return {
        compare: function (actual) {
          var result = { pass: false };
          result.pass = (actual === 'sweet');
          return result;
        }
      };
    }
  });
});
```

(For those used to previous versions of Jasmine, note that the interface to describe matchers has changed in version 2)

The `examples` folder contains an example that may be run with:

```bash
angela examples/sweet.spec.js --before examples/matchers.js
```


### Unit tests

While Angela is designed to run acceptance tests, you may also use it to run **unit tests** written with Jasmine. It just seems a bit overkill to use Angela if you **only** have unit tests as the instance of PhantomJS that the tool runs in the background is simply useless when unit tests are run.


## Integration with continuous integration servers

The `--junit` option generates JUnit XML reports in the `junitreports` folder. This lets you integrate Angela pretty easily with continuous integration servers such as [Jenkins](http://jenkins-ci.org/).


## Cleanup

Angela closes everything it can on exit. Set the `--keep` option to tell Angela to keep everything alive as long as you do not hit `Ctrl+C`. This can be useful to continue browsing afterwards, e.g. to detect other things worth testing.

Things can get a bit messy from time to time with WebDriver as servers sometimes crash for no apparent reason. If Angela reports weird results and refuses to run again, there may be some server still running in the background. A few commands that may help detect processes that should not be around in a Linux based environment:

```bash
ps aux | grep adb
ps aux | grep phantomjs
ps aux | grep selenium
```


## License

Angela is licensed under the [MIT license](LICENSE). Copyright (c) 2013 Joshfire. All rights reserved.

Angela uses great open-source libraries:

- [Jasmine](http://jasmine.github.io/). Copyright (c) 2008-2013 Pivotal Labs. [MIT Licensed](https://github.com/jasmine/jasmine/blob/master/MIT.LICENSE).
- [optimist](https://github.com/substack/node-optimist). Copyright 2010 James Halliday (mail@substack.net). [MIT/X11 license](https://github.com/substack/node-optimist/blob/master/LICENSE)
- [PhantomJS](http://phantomjs.org/). Copyright 2010-2013 Ariya Hidayat. [BSD License](https://github.com/ariya/phantomjs/blob/master/LICENSE.BSD)
- [npm wrapper for PhantomJS](https://github.com/Obvious/phantomjs). Copyright 2012 The Obvious Corporation. [Apache License 2.0](https://github.com/Obvious/phantomjs/blob/master/LICENSE.txt)
- [Selenium](https://code.google.com/p/selenium/), including [WebDriverJS](https://code.google.com/p/selenium/wiki/WebDriverJs), licensed under an [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0)
- [trycatch](https://github.com/CrabDude/trycatch). Copyright (C) 2011 by Adam Crabtree (dude@noderiety.com). [MIT License](https://raw.github.com/CrabDude/trycatch/master/LICENSE)
- [walk](https://github.com/coolaj86/node-walk). Copyright (c) 2011 AJ ONeal. [MIT license](http://opensource.org/licenses/mit-license.php)
- [Woodman](http://joshfire.github.io/woodman/). Copyright (c) 2013 Joshfire, all rights reserved, [MIT licensed](http://joshfire.github.io/woodman/about.html#license)

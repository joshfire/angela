# Angela

Angela is a Node.js CLI tool that runs suites of tests written with Jasmine against Web applications in a Web browser.

It wraps [Jasmine](http://jasmine.github.io/2.0/introduction.html), [Selenium's WebDriverJS](https://code.google.com/p/selenium/wiki/WebDriverJs) to control Web browsers, [PhantomJS](http://phantomjs.org/) for headless execution, and exposes a simple interface to run spec tests and set a few parameters.

Angela's main goal is to set things up so that you can focus on actually writing tests and not lose time installing libraries and running servers. Tests are run in PhantomJS by default but you may run them in Chrome, Firefox, Opera, Safari or Android thanks to the `--browser` option (some may not work on your platform). The tool launches the right WebDriver server for the targeted Web browser before running the tests.


## Installation

To install Angela globally:

```bash
npm install -g git+ssh://git@github.com:joshfire/angela.git
angela --help
```

This may take a couple of minutes as Angela includes a few binary files (~50Mb). If you prefer to clone the source code to your machine:

```
git clone git@github.com:joshfire/angela.git
cd angela
npm install
```

The `angela` program is an alias to the `lib/runner.js` script in the source code. If you are looking at the source code of the tool and wondering how to run it, just type: `node lib/runner.js --help`.


## An example

Install Angela and create a file named `sweet.spec.js` that contains:

```javascript
describe('Angela', function () {
  it('is very sweet', function (done) {
    driver.get('http://www.urbandictionary.com/define.php?term=Angela');
    driver.getElement
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
  --browser, -b     Webdriver browser endpoint. The code automatically starts
                    the "right" Webdriver server based on that setting.
                    Possible values include "phantomjs", "chrome", "firefox",
                    "safari", or "android" (provided browser or device is
                    available on your machine).           [default: "phantomjs"]
  --host            Webdriver server host                 [default: "localhost"]
  --port            Webdriver server port                        [default: 8195]
  --verbose, -v     Trace Angela's execution to the console     [default: false]
  --serverlog       Log Webdriver server execution to provided log file
                                                                   [default: ""]
  --useserver       Whether to use running Webdriver server or to start one
                                                                [default: false]
  --sessionperspec  Angela uses the same browser session throughout by default.
                    Set the flag to use one browser session per spec. Specs
                    will run considerably slower.               [default: false]
  --keep, -k        Whether to keep the browser open when tests are over
                                                                [default: false]
  --junit           Create JUnit XML reports (in "junitreports" folder)
                                                                [default: false]
  --help, -h        Displays usage help
```

## Execution

When run without parameter or option, Angela lists all files that end with `.spec.js` or `Spec.js` in the current working directory (and its subdirectories), starts a PhantomJS server in the background that exposes a WebDriver endpoint on port `8195` and runs the spec files it found against PhantomJS. It reports the results to the console.

Spec files are run one after the other using the same browser session unless you set the `--sessionperspec` flag (but note that this slows down execution a lot).

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
/*global describe, it, expect, driver*/
describe('The home page of Joshfire.com', function () {
  it('has the right title "Joshfire"', function (done) {
    driver.get('http://joshfire.com');
    driver.getTitle().then(function (title) {
      expect(title).toEqual('Joshfire');
      done();
    });
  });
});
```

Please note that Angela ships [version 2.0.0rc5 of Jasmine](http://jasmine.github.io/2.0/introduction.html), which introduces the `done` function in particular to ease authoring of asynchronous tests as well as the possibility to mark tests as `pending`.

The `driver` instance is the one exposed by the [Selenium's WebDriverJS](https://code.google.com/p/selenium/wiki/WebDriverJs) library. Check its documentation for usage. Note the use of *promises* in particular.

To run that example from the root folder of Angela:

```bash
angela spec/test.spec.js
```

Each test must complete within 30 seconds (or 2 minutes if tests are run on an Android device). That setting may be exposed in a future version of the tool if that seems useful.


## Integration with continuous integration servers

The `--junit` option generates JUnit XML reports in the `junitreports` folder. This lets you integrate Angela pretty easily with continuous integration servers such as [Jenkins](http://jenkins-ci.org/).


## Cleanup

Angela closes everything it can on exit. Set the `--keep` option to tell Angela to keep everything alive as long as you do not hit `Ctrl+C`. This can be useful to continue browsing afterwards, e.g. to detect other things worth testing.

Things can get a bit messy from time to time with WebDriver. WebDriver servers may crash from time to time in particular. If Angela reports weird results and refuses to run again, there may be some server still running in the background. A few commands that may help detect processes that should not be around:

```bash
ps aux | grep adb
ps aux | grep phantomjs
ps aux | grep selenium
```


## License

Copyright (c) 2013 Joshfire. All rights reserved.

Angela uses great open-source libraries:

- [Jasmine](http://pivotal.github.io/jasmine/). Copyright (c) 2008-2013 Pivotal Labs. [MIT Licensed](https://github.com/pivotal/jasmine/blob/master/MIT.LICENSE).
- [optimist](https://github.com/substack/node-optimist). Copyright 2010 James Halliday (mail@substack.net). [MIT/X11 license](https://github.com/substack/node-optimist/blob/master/LICENSE)
- [PhantomJS](http://phantomjs.org/). Copyright 2010-2013 Ariya Hidayat. [BSD License](https://github.com/ariya/phantomjs/blob/master/LICENSE.BSD)
- [npm wrapper for PhantomJS](https://github.com/Obvious/phantomjs). Copyright 2012 The Obvious Corporation. [Apache License 2.0](https://github.com/Obvious/phantomjs/blob/master/LICENSE.txt)
- [Selenium](https://code.google.com/p/selenium/), including [WebDriverJS](https://code.google.com/p/selenium/wiki/WebDriverJs), licensed under an [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0)
- [walk](https://github.com/coolaj86/node-walk). Copyright (c) 2011 AJ ONeal. [MIT license](http://opensource.org/licenses/mit-license.php)
- [Woodman](http://joshfire.github.io/woodman/). Copyright (c) 2013 Joshfire, all rights reserved, [MIT licensed](http://joshfire.github.io/woodman/about.html#license)
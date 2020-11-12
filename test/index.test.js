// eslint-disable-next-line no-unused-vars
const should = require('should');
const fs = require('fs');
const path = require('path');
const tool = require('diff-js-xml');

const JasmineJUnitReporter = require('../index');

describe('JasmineJUnitReporter', () => {
	it('matches expected output', finish => {
		const filename = path.join(__dirname, 'myreport.xml');
		const reporter = new JasmineJUnitReporter({
			filename
		});
		reporter.jasmineStarted();
		const suite = {
			fullName: 'test.suite'
		};
		reporter.suiteStarted(suite);
		const pending = {
			status: 'pending',
			fullName: 'test.suite.pending',
			id: 'whatever',
			pendingReason: 'because of stuff',
			failedExpectations: [],
			passedExpectations: []
		};
		reporter.specStarted(pending);
		reporter.specDone(pending);
		const passed = {
			status: 'passed',
			fullName: 'test.suite.passed',
			id: 'whatever2',
			failedExpectations: [],
			passedExpectations: [],
			stdout: 'stdout output'
		};
		reporter.specStarted(passed);
		reporter.specDone(passed);
		const failed = {
			status: 'failed',
			fullName: 'test.suite.failed',
			id: 'whatever3',
			failedExpectations: [ {
				stack: 'line 1',
				message: 'failed some assertion'
			} ],
			passedExpectations: [],
			stderr: 'stderr output'
		};
		reporter.specStarted(failed);
		reporter.specDone(failed);
		reporter.suiteDone(suite);
		reporter.jasmineDone();
		// Need to do loose matching of timestamp/time
		const contents = fs.readFileSync(filename, 'utf8');
		const expected = fs.readFileSync(path.join(__dirname, 'expected.xml'), 'utf8');
		tool.diffAsXml(expected, contents, undefined, { xml2jsOptions: { ignoreAttributes: false } }, result => {
			console.log(result);
			result.length.should.be.aboveOrEqual(1); // timestamp will differ (durations might)
			result.length.should.be.belowOrEqual(3); // might have two duration/times differ
			// timestamp differs
			result[0].path.should.eql('testsuites.testsuite._attributes.timestamp');
			result[0].resultType.should.eql('difference in element value');
			// durations may differ
			if (result.length > 1) {
				// validate it's the time attribute that differs
				for (let x = 1; x < result.length; x++) {
					result[x].path.should.endWith('._attributes.time');
				}
			}
			finish();
		});
	});
});

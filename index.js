'use strict';

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const JUNIT_TEMPLATE = path.join(__dirname, 'junit.xml.ejs');
// FIXME: I can't see how to configure a custom reporter unless invoked programatically!
const OUTPUT_FILENAME = 'junit_report.xml';

class Spec {
	constructor(jasmineSpec) {
		this.start = new Date();
		this.id = jasmineSpec.id;
		this.name = jasmineSpec.fullName; // use description? full name has the suite names pre-pended
		this.end = null;
		this.suite = null;
		this.failedExpectations = jasmineSpec.failedExpectations; // TODO Massage the failures to get rid of control chars!
		this.passedExpectations = jasmineSpec.passedExpectations;
		this.pendingReason = jasmineSpec.pendingReason;
	}

	done(jasmineSpec) {
		this.end = new Date();
		this.status = jasmineSpec.status;
	}

	duration() {
		return this.end.getTime() - this.start.getTime();
	}

	isSkipped() {
		return this.status === 'pending';
	}

	isFailed() {
		return this.failedExpectations.length > 0;
	}
}

class Suite {
	constructor(jasmineSuite) {
		this.start = new Date();
		this.name = jasmineSuite.fullName;
		this.end = null;
		this.specs = [];
		this.parent = null; // parent suite!
	}

	addChild(childSuite) {
		childSuite.parent = this;
	}

	done() {
		this.end = new Date();
		return this.parent;
	}

	addSpec(spec) {
		spec.suite = this;
		this.specs.push(spec);
	}

	getSpecByID(id) {
		return this.specs.find(spec => spec.id === id);
	}

	duration() {
		return this.end.getTime() - this.start.getTime();
	}

	startTimestamp() {
		return this.start.toISOString();
	}

	failureCount() {
		return this.specs.reduce((accumulator, spec) => accumulator + spec.failedExpectations.length, 0);
	}

	skippedCount() {
		return this.specs.filter(spec => spec.isSkipped()).length;
	}
}

function escapeInvalidXmlChars(testResults) {
	// preserve newlines, etc - use valid JSON
	return testResults.replace(/\\n/g, '\\n')
		.replace(/\\'/g, '\\\'')
		.replace(/\\"/g, '\\"')
		.replace(/\\&/g, '\\&')
		.replace(/\\r/g, '\\r')
		.replace(/\\t/g, '\\t')
		.replace(/\\b/g, '\\b')
		.replace(/\\f/g, '\\f')
		// remove non-printable and other non-valid JSON chars
		.replace(/[\u0000-\u0019]+/g, ''); // eslint-disable-line no-control-regex
}

function outputJUnitXML(suites) {
	try {
		const r = ejs.render('' + fs.readFileSync(JUNIT_TEMPLATE),  { suites: suites, escapeInvalidXmlChars: escapeInvalidXmlChars });
		fs.writeFileSync(path.join(process.cwd(), OUTPUT_FILENAME), r);
	} catch (e) {
		console.error(e);
	}
}

class JasmineJUnitReporter {

	constructor(options) { // eslint-disable-line no-unused-vars
		this.suites = new Map();
		this.currentSuite = null;
	}

	jasmineStarted(options) { // eslint-disable-line no-unused-vars
		this.suites.clear();
	}

	jasmineDone(result) { // eslint-disable-line no-unused-vars
		outputJUnitXML([ ...this.suites.values() ]);
	}

	specStarted (spec) {
		this.currentSuite.addSpec(new Spec(spec));
	}

	specDone(spec) {
		// Grab the existing spec from our current suite?
		const existingSpec = this.currentSuite.getSpecByID(spec.id);
		existingSpec.done(spec);
	}

	suiteStarted(suite) {
		let ourSuite;
		if (this.suites.has(suite.id)) {
			ourSuite = this.suites.get(suite.id);
			// ourSuite.start(); // TODO: restart the timer?
		} else {
			ourSuite = new Suite(suite);
			this.suites.set(suite.id, ourSuite);
		}
		this.currentSuite = ourSuite;
	}

	suiteDone(suite) {
		const existing = this.suites.get(suite.id);
		this.currentSuite = existing.done();
	}
}

module.exports = exports = JasmineJUnitReporter;

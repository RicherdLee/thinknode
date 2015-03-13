var assert = require('assert'),
    captcha = require('../index');


function testCaptcha() {
	var options = {
		values: 'abc',
		length: 3
	},
	result = captcha(options);
	assert(result.svg);
	assert(result.captchaValue);
	assert(result.captchaValue.length === 3);
	assert(result.svg.match(/<text/g).length === 3);
}

function testDictionary() {
	var options = {
		values: 'a',
		length: 3
	},
	result = captcha(options);
	assert(result.svg);
	assert(result.captchaValue === 'aaa');
}

function testDefaultOptions() {
	var result = captcha();
	assert(result.svg);
	assert(result.captchaValue);
	assert(result.captchaValue.length === 8);
	assert(result.svg.match(/<text/g).length === 8);		
}

function testGrayScale(){
	var options = {
		values: 'abc',
		length: 3,
		color: false,
		noise: 0,
		lines:0
	},
	result = captcha(options),
	color = result.svg.match(/<text style="fill:#(\w{3})+/i)[1];
	assert(result.svg);
	assert(color.match(/000|111|222|333|444|555|666|777|888|999|AAA|BBB|CCC|DDD|EEE/));
}

function testColor(){
	var options = {
		values: 'abc',
		length: 3,
		color: true,
		noise: 0,
		lines:0
	},
	result = captcha(options),
	color = result.svg.match(/<text style="fill:#(\w{6})+/i)[1];
	assert(result.svg);
	assert(color.match(/[0-9A-F]/));
}

function testNoise(){
	var options = {
		values: 'abc',
		length: 3,
		color: true,
		noise: 4,
		lines:0
	},
	result = captcha(options);
	assert(result.svg);
	assert(result.svg.match(/<line/g).length === 100);
}

function testNoNoise(){
	var options = {
		values: 'abc',
		length: 3,
		color: true,
		noise: 0,
		lines:0
	},
	result = captcha(options);
	assert(result.svg);
	assert(result.svg.match(/<line/g) === null);
}

function testNumberOfLines() {
	var options = {
		values: 'abc',
		length: 3,
		color: true,
		noise: 0,
		lines: 2
	},
	result = captcha(options);
	assert(result.svg);
	assert(result.svg.match(/<path/g).length === 2);
}

testCaptcha();
testDictionary();
testDefaultOptions();
testGrayScale();
testColor();
testNoise();
testNoNoise();
testNumberOfLines();

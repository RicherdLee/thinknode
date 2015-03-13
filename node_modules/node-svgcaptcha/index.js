'use strict';

var defaultOptions = {
		values: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
		length: 8,
		width: 200,
		height: 50,
		color: true,
		lines: 2,
		noise: 1
	};

module.exports = function(opts) {
	var options = merge_options(defaultOptions, opts||{}),
		width = options.width,
		height = options.height;

	/**
	* Generate random number from min to max 
	* @param min 
	* @param max
	* @returns a random number between min and max
	*/
	function randomIntFromInterval(min,max) {
		return Math.floor(Math.random()*(max-min+1)+min);
	}

	/**
	* Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
	* @param obj1
	* @param obj2
	* @returns a new object based on obj1 and obj2
	*/
	function merge_options(obj1,obj2){
		var objAux = {};
		for (var attrname in obj1) { objAux[attrname] = obj1[attrname]; }
		for (var attrname in obj2) { objAux[attrname] = obj2[attrname]; }
		
		return objAux;
	}

	/**
	* Generate random text for captcha 
	* @returns a random text
	*/
	function generateRandomText() {
		var dictionary = options.values,
			captchaLength = options.length,
			result = '',
			random, idx;
		for(var i=0;i<captchaLength;i++) {
			random = randomIntFromInterval(0,500);
			idx = random % dictionary.length;
			result += dictionary[idx];
		}
		return result;
	}

	
	/**
	*  Convert decimal number to hexadecimal 
	* @param number: number to convert
	* @returns hex value of decimal number
	*/
	function decimalToHexString(number){
		if (number < 0) {
			number = 0xFFFFFFFF + number + 1;
		}
		return number.toString(16).toUpperCase();
	}

	/**
	* Function that returns a random color 
	* @returns a random rgb color
	*/
	function randomColor() {
		var r = randomIntFromInterval(0, 255),
			g = randomIntFromInterval(0, 255),
			b = randomIntFromInterval(0, 255),
			rHex, gHex, bHex;

		rHex = decimalToHexString(r);
		gHex = decimalToHexString(g);
		bHex = decimalToHexString(b);
		return '#' + rHex + gHex + bHex;	
	}

	/**
	* Function that returns a random color in gray scale 
	* @returns a random gray scale rgb value;
	*/
	function randomGray() {
		var random = randomIntFromInterval(0,14),
			hex = decimalToHexString(random);
			return '#' + hex + hex + hex;
	}

	/**
	* Function that generate noise
	* @param level: level of noise points
	* @returns svg points for noise
	*/
	function generateNoise(level) {
		var noise = '', x, y, xEnd;
		for(var i=0; i<level * 25; i++) {
			x = randomIntFromInterval(10, width-10);
			y = randomIntFromInterval(0, height);
			xEnd = x + 1;
			noise += '<line x1="' + x + '" y1="' + y + '" x2="' + xEnd + '" y2="' + y + '" style="stroke:rgb(0,0,0);stroke-width:2" />';
		}
		return noise;
	}

	/**
	* Function that generate lines
	* @param level: level of noise points
	* @returns svg points for noise
	*/
	function generateLines(num) {
		var result = '',
			start, endX, endY, middlePoint1, middlePoint2;
		for(var i=0;i<num;i++) {
			start = randomIntFromInterval(5,20) + ' ' + randomIntFromInterval(5, height - 5);
			endX = randomIntFromInterval(width- 20, width);
			endY = randomIntFromInterval(5, height - 5);
			middlePoint1 = randomIntFromInterval(width/2 - 20, width/2 + 20) + ' ' + randomIntFromInterval(5, height - 5);
			middlePoint2 = randomIntFromInterval(width/2 - 20, width/2 + 20) + ' ' + randomIntFromInterval(5, height - 5);
			result += '<path d="M' + start + ' C ' + middlePoint1 + ',' +  middlePoint2 + ', ' + endX + ' ' + endY + '" stroke="black" fill="transparent"/>';
		}
		return result;
	}

	/**
	* Function that returns svg text
	* @params text to generate letters
	* @returns svg letters
	*/
	function stringToSVG(text){
		var svgText = '',
			hasColor = options.color,
			x = 5, 
			y = 30,
			color,size,rotation,jump;

		for(var i=0;i<text.length; i++) {
			if(hasColor) {
				color = randomColor();
			} else {
				color = randomGray();
			}
			rotation = randomIntFromInterval(-25,25);
			size = randomIntFromInterval(20,height - 10);
			jump = randomIntFromInterval(-5,5);

			svgText += '<text style="fill:' + color + ';" x="' + x +'" y="' + y + '" font-size="' + size  + '" ';
			svgText += 'transform="translate(' + x + ', ' + (y + jump)  + ') rotate(' + rotation + ') translate(-' + x + ', -' + (y + jump)  + ')">';
			svgText += text[i] + '</text>';
			x += 20;
		}

		return svgText;
	}

	/**
	* Function that returns svg text
	* @params text to generate letters
	* @returns object with generated svg and captcha value
	*/
	function createSVG(text) {
		var lines = options.lines,
			noise = options.noise,
			xml = '<?xml version="1.0" encoding="utf-8"?>';
    
		//headers
		xml += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">';
		xml += '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve"'
		xml += ' width="' + width + '" height="' + height + '">'

		//background
		xml += '<rect x="0" y="0" width="' + width + '" height="' + height + '" style="stroke: none; fill: none;" ></rect> ';

		//noise
		xml += generateNoise(noise);
		//line
		xml += generateLines(lines);

		//the text
		xml += stringToSVG(text);

		//end SVG
		xml += '</svg>';

		return {svg: xml, captchaValue: text};
	}

	/**
	* Function that generate random text and svg object
	* @returns object with generated svg and captcha value
	*/
	function generateCaptcha() {
		var text = generateRandomText();
		return createSVG(text);
	}

	return generateCaptcha();

}
node-svgcaptcha
===============

A npm module to generate a captcha with svg image


How to use:
================
Install npm package:

	npm install node-svgcaptcha
	
In your code:

	app.get('/captcha', function(req, res){

		var captcha = require('node-svgcaptcha');
		var options = {};//Set your configuration in this object
		var genCaptcha = captcha(options);
		
		if(req.session){//save value in session
			req.session.captcha = genCaptcha.captchaValue;
		}
		
		//return svg to render in the browser
		res.set('Content-Type', 'image/svg+xml');
		res.send(genCaptcha.svg);	
	});


Options:
===============
	  Options that we can pass to the module with the default values:
	  
	  values: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' // String with chars to generate random captcha
		length: 8 // lenght of chars in generated captcha
		width: 200 // width of the generated image
		height: 50 // height of the generated image
		color: true // true means that letters are painted in colors and false in gray scale
		lines: 2 // number of lines in the captcha
		noise: 1 // level of noise (points) in the captcha
		

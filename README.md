# Setup

1. Copy `config/sample.json` to `config/default.json` and fill out the appropriate fields. You will need to provide all of your API keys. For Uber, you will need a valid token from oAuth2.0 which is currently up to you. Optionally add a forecast.io weather API key (`Weather.api-key`).

2. Create a new Alexa skill and use the provided info in `interaction-model.txt` for your Intent Schema and Sample Utterences, as well as Custom Slot Types.

3. Upload to your lambda function. I am using grunt as configured in `gruntFile.js`. You can deploy to Lambda using `grunt deploy`. See https://github.com/Tim-B/grunt-aws-lambda for more info

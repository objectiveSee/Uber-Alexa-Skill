# Setup

1. All configuraton and user-specific variables are handled inside of `config/default.json`. Copy `config/sample.json` to `config/default.json` and fill out the appropriate fields. You will need to provide all of your API keys. For Uber, you will need a valid token from oAuth2.0 which is currently up to you. Optionally add a Forecast.io weather API key (`Weather.api-key`).

2. Create a new Alexa skill and use the provided info in `interaction-model.txt` for your Intent Schema and Sample Utterences, as well as Custom Slot Types.

3. Upload code to your lambda function. `gruntFile.js` has been configured to upload to you Lambda function. You can deploy to Lambda using `grunt deploy`. See https://github.com/Tim-B/grunt-aws-lambda for more info

4. Configure lambda function. Make sure you set the handler to `skill.handler` and add an `Alexa Skills Kit` event source.

# Notes

- Provides a `sandbox` flag in config for testing.

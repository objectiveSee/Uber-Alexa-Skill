# Sample Phrases

```
Alexa, tell Uber to pick me up.

Alexa, ask Uber how far away the nearest car is.

Alexa, ask Uber where my car is.

Alexa, ask Uber if it is using sandbox. (Debugging Info)
```


# Setup

1. All configuraton and user-specific variables are handled inside of `config/default.json`. Copy `config/sample.json` to `config/default.json` and fill out the appropriate fields. You will need to provide all of your API keys. For Uber, you will need a valid token from oAuth2.0 which is currently up to you. Optionally add a Forecast.io weather API key (`Weather.api-key`).

```js
{
  	"Uber": {
		"client_id": "required",
		"client_secret": "required",
		"server_token": "required",
		"redirect_uri": "optional",
		"access_token":"required",
		"sandbox" : true
	},
    "Alexa": {
		"location": { "latitude": required, "longitude": required },
		"lambda-arn" : "required"
    },
    "Weather" : {
    	"api-key" : "optional"
    }
}
```

2. Create a new Alexa skill and use the provided info in `interaction-model.txt` for your Intent Schema and Sample Utterences, as well as Custom Slot Types.

3. Upload code to your lambda function. `gruntFile.js` has been configured to upload to you Lambda function. You can deploy to Lambda using `grunt deploy`. See https://github.com/Tim-B/grunt-aws-lambda for more info

4. Configure lambda function. Make sure you set the handler to `skill.handler` and add an `Alexa Skills Kit` event source.

# Notes

- The main entry point for the code is `skill.js` which uses boilerplate Skill code from Amazon. This is where most of the Alexa and speech code lives.
- `uber-skill-handler.js` contains most of the code dealing with the Uber API.
- Provides a `sandbox` flag in config for testing.

var grunt = require('grunt');
var config = require('config');
grunt.loadNpmTasks('grunt-aws-lambda');

grunt.initConfig({
   lambda_invoke: {
      default: {
         // options: {
         //    file_name: 'CreateThumbnail.js'
         // }
      }
   },
   lambda_deploy: {
   	  
      default: {
         // function: 'CreateThumbnail'
         arn : config.get('Alexa.lambda-arn'),
         options : {
         	region : 'us-east-1',
         	profile : 'personal',
         	file_name: 'skill.js'
      	}

      },
   },
   lambda_package: {
      default: {
      	arn : config.get('Alexa.lambda-arn'),
         options : {
         	region : 'us-east-1',
         	profile : 'personal',
         	file_name: 'skill.js'
      	}
   	  }
   }
});

grunt.registerTask('deploy', ['lambda_package', 'lambda_deploy'])
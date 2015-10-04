var grunt = require('grunt');
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
         arn : 'arn:aws:lambda:us-east-1:017523382944:function:UberAlexaLambdaFunction',
         options : {
         	region : 'us-east-1',
         	profile : 'personal',
         	file_name: 'skill.js'
      	}

      },
   },
   lambda_package: {
      default: {
      	arn : 'arn:aws:lambda:us-east-1:017523382944:function:UberAlexaLambdaFunction',
         options : {
         	region : 'us-east-1',
         	profile : 'personal',
         	file_name: 'skill.js'
      	}
   	  }
   }
});

grunt.registerTask('deploy', ['lambda_package', 'lambda_deploy'])
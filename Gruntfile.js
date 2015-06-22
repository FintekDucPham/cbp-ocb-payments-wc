module.exports = function (grunt) {
  require('cbp-raiffeisen-build-tools')(grunt);

  grunt.registerTask('default', [
	'build-prod'
  ]);
  
};

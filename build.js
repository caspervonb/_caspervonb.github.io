var metalsmith = require('metalsmith');
var templates = require('metalsmith-templates');
var markdown = require('metalsmith-markdown');
var collections = require('metalsmith-collections');
var permalinks = require('metalsmith-permalinks');
var excerpts = require('metalsmith-excerpts');
var redirect = require('metalsmith-redirect');

var moment = require('moment');

  var helpers = {
     "datetime": function(date, format) {
        date = date || moment();
        return moment(date).format(format || 'ddd, DD MMM YYYY HH:mm:ss ZZ');
     }
  };

  // Define partials.
var partials = {
   "head": "partials/head",
   "footer": "partials/footer",
     "header": "partials/header",
     "share": "partials/share"
  };

   builder = metalsmith(__dirname);

   builder.metadata({
     site : {
       url: 'http://caspervonb.github.io',
     },
   });

   builder.use(collections({
      posts: {
         pattern: 'posts/*.md',
         sortBy: 'date',
         reverse: true
      }
   }));

   
   builder.use(markdown({
      highlight: function (code, language) {
         var prism = require('prismjs');
         return prism.highlight(code, prism.languages[language || 'javascript']);
      }
   }));



   builder.use(permalinks({
      pattern: ':date/:title',
   }));
   builder.use(excerpts());
   
   builder.use(templates({
      engine: 'handlebars',
      directory: 'src',
      pattern: '**/*',
      inPlace: true,
      helpers: helpers,
      partials: partials,
   }));

   builder.use(templates({
      engine: 'handlebars',
      directory: 'templates',
      helpers: helpers,
      partials: partials,
   }));

   builder.use(redirect({
      '/2014/02/24/javascript-game-development-asynchronous-execution-loop.html': '/2014/02/24/javascript-game-development-asynchronous-execution-loop/',
      '/2014/03/02/javascript-game-development-game-states.html': '/2014/03/02/javascript-game-development-managing-game-states/',
      '/2014/03/05/ecmascript6-features-and-tools.html': '/2014/03/31/ecmascript-6-features-and-tools/',
   }));

   builder.build(function(err) {
      if (err) {
         throw err;
      }
   });

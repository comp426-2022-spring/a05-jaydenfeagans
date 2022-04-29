// Place your server entry point code here

// Require Express.js / minimist
const express = require("express")
const app = express()

// Serve static HTML files
app.use(express.static('./public'));

// Make Express use its own built-in body parser to handle JSON
app.use(express.json());

// Require minimist
const args = require('minimist')(process.argv.slice(2));
const port = args["port"] || args.p || 5000
console.log(args)

// Require db
const db = require('./src/services/database.js')
// Require fs
const fs = require('fs');
// Require morgan
const morgan = require('morgan')

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Start an app server
const server = app.listen(port, () => {
  console.log('App listening on port %PORT%'.replace('%PORT%',port))
});

// test if api works
app.get("/app/", (req, res, next) => {
  res.json({"message":"working API(200)"});
  res.status(200);
});

// check if log file is being created
if (args.log == 'false') {
  console.log("Not creating file access.log")
} else {
  const accessLog = fs.createWriteStream('access.log', { flags: 'a'})
  app.use(morgan('combined', {stream: accessLog }))
}

// Store help text 
const help = (`
server.js [options]
--port, -p	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug, -d If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help, -h	Return this message and exit.
`)
// If --help, echo help text and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

// Middleware
app.use((req, res, next) => {
  let logData = {
      remoteaddr: req.ip,
      remoteuser: req.user,
      time: Date.now(),
      method: req.method,
      url: req.url,
      protocol: req.protocol,
      httpversion: req.httpVersion,
      status: res.statusCode,
      referrer: req.headers['referer'],
      useragent: req.headers['user-agent']
  };
  console.log(logData)
  const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const info = stmt.run(logData.remoteaddr, logData.remoteuser, logData.time, logData.method, logData.url, logData.protocol, logData.httpversion, logData.status, logData.referrer, logData.useragent)
  next();
})

// endpoints IFF --debug=true
if(args.debug === true) {
  // /app/log/access endpoint
  app.get('/app/log/access/', (req, res) => {
    const stmt = db.prepare("SELECT * FROM accesslog").all()
    res.status(200).json(stmt)
  });

  // /app/log/access endpoint
  app.get('/app/error', (req, res) => {
    throw new Error('Error, test successful')
  });
}

//
//functions and endpoints
//


app.get('/app/', (req, res) => { 
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
        res.end(res.statusCode+ ' ' +res.statusMessage)
});

// modified endpoints from assignment page a5

// flip multiple coins
app.post('/app/flip/coins/', (req, res, next) => {
    const flips = coinFlips(req.body.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
})
// call coin flip
app.post('/app/flip/call/', (req, res, next) => {
    const game = flipACoin(req.body.guess)
    res.status(200).json(game)
})

// modify other endpoints to match

// Flip a coin endpoint
app.get('/app/flip/', (req, res, next) => {
    const result = coinFlip();
    res.status(200).json({ "flip" : flip })
  });


// OLD ENDPOINTS FROM A03/A04

// Flip a coin endpoint
/*
app.get('/app/flip/', (req, res) => {
  res.statusCode = 200;
  res.statusMessage = 'OK';
  const result = coinFlip();
  if(result == "heads") {
      res.json({"flip":"heads"});
  } else {
      res.json({"flip":"tails"});
  }
});
*/
// Flip multiple coins
/*
app.get('/app/flips/:number', (req, res) => {
  const flips = coinFlips(req.params.number);
  res.status(200).json({"raw": flips, "summary" : countFlips(flips)})
});
*/
// Guess Heads
/*
app.get('/app/flip/call/heads', (req, res) => {
  res.statusCode = 200;
  res.statusMessage = 'OK';
  const result = flipACoin('heads');
  res.json(result);
});
// Guess Tails
app.get('/app/flip/call/tails', (req, res) => {
  res.statusCode = 200;
  res.statusMessage = 'OK';
  const result = flipACoin('tails');
  res.json(result);
});
*/
// Default response for any other request
app.use(function(req, res) {
  res.status(404).send('404 NOT FOUND')
});

//
//functions
//
function coinFlip() {
  const result = Math.random();
  if(result < .5) {
    return "heads";
  } else {
    return "tails";
  }
}
function coinFlips(flips) {
  const results = [];
  for(i=0; i <flips; i++) {
    results[i] = coinFlip();
  }
  return results;
}
function countFlips(array) {
  var head = 0;
  var tail = 0;

  for(i=0; i<array.length; i++) {
    if(array[i] == 'heads') {
      head++;
    } else {
      tail++;
    }
  }
  return {heads: head, tails: tail};
} 
function flipACoin(call) {
  let flip = coinFlip()
  const obj = { call: call, flip: flip, result: 'lose' }
  if (call == flip) {
      obj.result = 'win';
  }
  return obj;
}
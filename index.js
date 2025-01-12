require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


// ----------------->>>>>>>>>>>>>>>>>>
const dns = require('dns');

// In-memory storage for URLs
const urlDatabase = {};
let shortUrlCounter = 1;

// Function to validate hostname using DNS lookup
function validateUrl(submittedUrl, callback) {
  let hostname;

  try {
    hostname = new URL(submittedUrl).hostname;
  } catch (error) {
    return callback(false);
  }

  dns.lookup(hostname, (err) => {
    if (err) {
      callback(false);
    } else {
      callback(true);
    }
  });
}

// Handle POST request to create short URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  validateUrl(originalUrl, (isValid) => {
    if (!isValid) {
      return res.json({ error: 'invalid url' });
    }

    // Store URL and assign short URL
    const shortUrl = shortUrlCounter++;
    urlDatabase[shortUrl] = originalUrl;

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// Redirect to original URL when short URL is visited
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.send('Not found');
  }
});

app.use('*', (req, res)=>{
  return res.send('Not found');
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

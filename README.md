# czar

A light weight and robust CMS for node.js with dead simple integration. Just include the module and start it up with some simple configuration.


## install

`npm i -S czar`

## get started

Configure your server:

```javascript
import express from 'express'
import path from 'path'

/* 1. Include the module. */
import CMS from 'czar'

const app = express()
const port = 8080

app.use('/', express.static(__dirname))

/* 2. Initialise czar with your express instance. */
const cms = new CMS(app)

/*
   3. Call start() with your configuration, it must be an array containing sections.
  
      The following example is enough to creat and edit simple blog posts.
*/
cms.start([
  {
    name: 'blog',
    fields: [
      {type: 'text', name: 'title'},
      {type: 'textarea', name: 'body'}
    ]
  }
])
```

Fetch the data in the front end:

```javascript
$.ajax({
  method: 'POST',
  url: '/get-data/blog', /* /get-data/{page-name} */
  dataType: 'json',
  data: {
    from: 0,
    limit: 5,
    filter: {} /* Optionally filter any properties. */
  }
})
.done(function(posts) {
  /*  You have your posts! */
})
```

Easy!

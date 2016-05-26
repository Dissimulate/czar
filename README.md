# czar

A light weight and flexible CMS for node.js with dead simple integration.

Include the module, start it up within your express server and everything is handled for you.

![alt tag](http://i.imgur.com/LpNxVnU.png)


## install

`npm i -S czar`

## get started

Configure your server:

```javascript
const express = require('express')
const path = require('path')

/* 1. Include the module. */
const CMS = require('czar')

const app = express()

/* 2. Initialise czar with your express instance. */
const cms = new CMS(app)

/* 3. Call start() with your configuration, it must be an array containing sections.
      The following example is enough to create and edit simple blog posts.
*/
cms.start([{
  name: 'blog',
  fields: [
    {type: 'text', name: 'title'},
    {type: 'textarea', name: 'body'}
  ]
}])
```

Visit `yoursite.com/admin`, create an admin login and manage your items.

Fetch the data in the front end:

```javascript
$.ajax({
  method: 'POST',
  url: '/data/get/blog', /* /data/get/{page-name} */
  dataType: 'json',
  data: {
    from: 0,         /* (Optional) fetch items after an index */
    limit: 5,        /* (Optional) maximum items to fetch */
    filter: {},      /* (Optional) filter any properties */
    sort: 'created', /* (Optional) sort by a property, defaults to creation time */
    order: 'desc'    /* (Optional) order in desc or asc order, defaults to desc */
    trunc: 100       /* (Optional) truncate the fields */
  }
})
.done(function(posts) {
  /*  You have your posts! */
})
```

Easy!

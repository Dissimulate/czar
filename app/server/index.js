'use strict'

const path = require('path')
const low = require('lowdb')
const express = require('express')
const credential = require('credential')
const bodyParser = require('body-parser')
const storage = require('lowdb/file-async')

const pw = credential()
const jsonParser = bodyParser.json()

class CMS {
  constructor (app, database) {
    this.app = app
    this.data = low(database || 'data.json', {storage})
    this.users = low('users.json', {storage})
    this.authed = {}
    this.timeout = 180000
  }

  /* check if user has a valid login */
  checkLogin (req, res, redirect) {
    const ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

    if (this.authed[ip]) {
      if (Date.now() >= this.authed[ip].time) {
        delete this.authed[ip]
        return false
      }
      this.authed[ip].time = Date.now() + this.timeout
      return true
    } else if (redirect) {
      const first = !this.users('account').find({})

      res.sendFile(
        path.resolve(__dirname, first
          ? '../../public/signup.html'
          : '../../public/login.html'
        )
      )

      return false
    } else return false
  }

  /* set up routes */
  start (config) {
    this.config = config

    this.app.use(
      '/admin/file',
      express.static(path.resolve(__dirname, '../../public'))
    )

    /* main route */
    this.app.get('/admin', (req, res) => {
      this.checkLogin(req, res, true) &&
      res.sendFile(
        path.resolve(__dirname, '../../public/index.html')
      )
    })

    /* fall back to index.html */
    this.app.get('/admin/*', (req, res) => {
      this.checkLogin(req, res, true) &&
      res.sendFile(
        path.resolve(__dirname, '../../public/index.html')
      )
    })

    /* list configured pages */
    this.app.get('/data/pages', (req, res) => {
      res.json(this.config)
    })

    /* get page data */
    this.app.post('/data/get/:page', jsonParser, (req, res) => {
      let post =
      this.data(req.params.page)
          .chain()
          .filter(req.body.filter || {})
          .orderBy(req.body.sort || 'created', [req.body.order || 'desc'])
          .splice(req.body.from || 0, req.body.limit || Infinity)
          .value()

      post = JSON.parse(JSON.stringify(post))

      if (req.body.trunc) {
        post.forEach((page) => {
          Object.keys(page).forEach((key) => {
            if (page[key].length > req.body.trunc) {
              page[key] = page[key].substring(0, req.body.trunc) + '...'
            }
          })
        })
      }

      res.json(post)
    })

    /* save data to page */
    this.app.post('/data/save', jsonParser, (req, res) => {
      if (!req.body) return res.sendStatus(400)

      if (!this.checkLogin(req)) {
        return res.sendStatus(403)
      }

      if (req.body.update) {
        this.data(req.body.name)
            .chain()
            .find({created: req.body.row.created})
            .assign(req.body.row)
            .value()
            .then(() => res.sendStatus(200))
      } else {
        req.body.row.created = Date.now()
        req.body.row.published = true

        this.data(req.body.name)
            .push(req.body.row)
            .then(() => res.sendStatus(200))
      }
    })

    /* delete item(s) from page */
    this.app.post('/data/delete', jsonParser, (req, res) => {
      if (!req.body) return res.sendStatus(400)

      if (!this.checkLogin(req)) {
        return res.sendStatus(403)
      }

      this.data(req.body.page)
          .remove({created: req.body.created})
    })

    /* perform login */
    this.app.post('/admin-login', jsonParser, (req, res) => {
      if (!req.body) return res.sendStatus(400)

      let ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

      let user = this.users('account').find({user: req.body.user}) || {}

      pw.verify(user.hash, req.body.pass, (err, isValid) => {
        if (err) throw err

        if (isValid) {
          this.authed[ip] = {user: req.body.user}
          this.authed[ip].time = Date.now() + this.timeout
          return res.sendStatus(200)
        }

        return res.sendStatus(400)
      })
    })

    /* perform logout */
    this.app.get('/admin-logout', (req, res) => {
      let ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

      delete this.authed[ip]

      res.sendStatus(200)
    })

    /* add new admin user */
    this.app.post('/admin-add', jsonParser, (req, res) => {
      if (!req.body) return res.sendStatus(400)

      let ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

      if (!this.checkLogin(req) && this.users('account').find({})) {
        return res.sendStatus(403)
      }

      if (req.body.update) {
        req.body.user = this.authed[ip].user
      }

      if (this.users('account').find({user: req.body.user})) {
        if (!req.body.update) {
          return res.sendStatus(403)
        }
      }

      pw.hash(req.body.pass, (err, hash) => {
        if (err) throw err

        if (req.body.update) {
          this.users('account')
              .remove({user: req.body.user})
        }

        let first = !this.users('account').find({})

        this.users('account').push({
          user: req.body.user,
          hash: hash,
          first: first
        })

        res.sendStatus(200)
      })
    })

    /* list admin users */
    this.app.get('/admin-list', (req, res) => {
      if (!this.checkLogin(req, res)) {
        return res.sendStatus(403)
      }

      let users = this.users.object.account.map((user) => user.user)

      res.json(users)
    })

    /* delete admin user */
    this.app.post('/admin-delete', jsonParser, (req, res) => {
      if (!this.checkLogin(req, res)) {
        return res.sendStatus(403)
      }

      let user = this.users('account').find({user: req.body.user})

      /* prevent deletion of primary user */
      if (!user.first) {
        this.users('account').remove({user: req.body.user})
        return res.sendStatus(200)
      } else return res.sendStatus(403)
    })
  }
}

module.exports = CMS

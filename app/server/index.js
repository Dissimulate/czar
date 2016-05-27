'use strict'

const path = require('path')
const low = require('lowdb')
const storage = require('lowdb/file-async')
const bodyParser = require('body-parser')
const credential = require('credential')
const express = require('express')

const pw = credential()
const jsonParser = bodyParser.json()

class CMS {
  constructor (app, database) {
    this.app = app
    this.data = low(database || 'data.json', {storage})
    this.users = low('users.json', {storage})
    this.authed = {}
    this.timeout = 1800000
  }

  checkLogin (req, res) {
    const ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

    if (this.authed[ip]) {
      if (Date.now() >= this.authed[ip].time) {
        delete this.authed[ip]
        return false
      } else {
        this.authed[ip].time = Date.now() + this.timeout
        return true
      }
    } else {
      if (this.users('account').find({})) {
        res.sendFile(
          path.resolve(__dirname, '../../public/login.html')
        )
      } else {
        res.sendFile(
          path.resolve(__dirname, '../../public/signup.html')
        )
      }
      return false
    }
  }

  start (config) {
    this.config = config

    this.app.use(
      '/admin/file',
      express.static(path.resolve(__dirname, '../../public'))
    )

    this.app.get('/admin', (req, res) => {
      this.checkLogin(req, res) &&
      res.sendFile(
        path.resolve(__dirname, '../../public/index.html')
      )
    })

    this.app.get('/admin/*', (req, res) => {
      this.checkLogin(req, res) &&
      res.sendFile(
        path.resolve(__dirname, '../../public/index.html')
      )
    })

    this.app.get('/data/pages', (req, res) => {
      res.json(this.config)
    })

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

    this.app.post('/data/save', jsonParser, (req, res) => {
      if (!req.body) return res.sendStatus(400)

      let ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

      if (this.authed[ip]) {
        if (Date.now() >= this.authed[ip].time) {
          delete this.authed[ip]
          return
        } else {
          this.authed[ip].time = Date.now() + this.timeout
        }
      } else return res.sendStatus(403)

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

    this.app.post('/data/delete', jsonParser, (req, res) => {
      if (!req.body) return res.sendStatus(400)

      let ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

      if (this.authed[ip]) {
        if (Date.now() >= this.authed[ip].time) {
          delete this.authed[ip]
          return
        } else {
          this.authed[ip].time = Date.now() + this.timeout
        }
      } else return res.sendStatus(403)

      this.data(req.body.page)
          .remove({created: req.body.created})
    })

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
          res.sendStatus(200)
        } else {
          res.sendStatus(400)
        }
      })
    })

    this.app.get('/admin-logout', jsonParser, (req, res) => {
      let ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

      delete this.authed[ip]

      res.sendStatus(200)
    })

    this.app.post('/admin-add', jsonParser, (req, res) => {
      if (!req.body) return res.sendStatus(400)

      let ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

      if (this.authed[ip]) {
        if (Date.now() >= this.authed[ip].time) {
          delete this.authed[ip]
          return
        } else {
          this.authed[ip].time = Date.now() + this.timeout
        }
      } else if (this.users('account').find({})) {
        return res.sendStatus(403)
      }

      if (req.body.update) {
        req.body.user = this.authed[ip].user
      }

      if (this.users('account').find({user: req.body.user})) {
        if (!req.body.update) return res.sendStatus(403)
      }

      pw.hash(req.body.pass, (err, hash) => {
        if (err) throw err

        if (req.body.update) {
          this.users('account')
              .remove({user: req.body.user})
        }

        this.users('account').push({
          user: req.body.user,
          hash: hash
        })

        res.sendStatus(200)
      })
    })
  }
}

module.exports = CMS

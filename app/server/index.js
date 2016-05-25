'use strict'

const path = require('path')
const low = require('lowdb')
const storage = require('lowdb/file-async')
const bodyParser = require('body-parser')
const credential = require('credential')
const express = require('express')

let pw = credential()
let jsonParser = bodyParser.json()

let authed = {}
let timeout = 2000000

class CMS {
  constructor (app, database) {
    this.app = app
    this.data = low(database || 'data.json', {storage})
    this.users = low('users.json', {storage})
  }

  start (config) {
    this.config = config

    this.app.use('/admin/file', express.static(path.resolve(__dirname, '../../public')))

    this.app.get('/admin', (req, res) => {
      let ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

      if (authed[ip]) {
        if (Date.now() >= authed[ip]) {
          delete authed[ip]
          return
        } else {
          authed[ip] = Date.now() + timeout
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
        return
      }

      res.sendFile(
        path.resolve(__dirname, '../../public/index.html')
      )
    })

    this.app.get('/admin/*', (req, res) => {
      let ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

      if (authed[ip]) {
        if (Date.now() >= authed[ip]) {
          delete authed[ip]
          return
        } else {
          authed[ip] = Date.now() + timeout
        }
      } else {
        if (this.users('account').find({})) {
          res.sendFile(
            path.resolve(__dirname, '../../public/login.html')
          )
        } else {
          res.sendFile(
            path.resolve(__dirname, '.../../public/signup.html')
          )
        }
        return
      }

      res.sendFile(
        path.resolve(__dirname, '../../public/index.html')
      )
    })

    this.app.post('/get-data/:page', jsonParser, (req, res) => {
      const post = this.data(req.params.page)
        .chain()
        .filter(req.body.filter || {})
        .orderBy(req.body.sort || 'created', [req.body.order || 'desc'])
        .splice(req.body.from || 0, req.body.limit || Infinity)
        .value()

      res.json(post)
    })

    this.app.post('/data/save', jsonParser, (req, res) => {
      if (!req.body) return res.sendStatus(400)

      let ip = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress

      if (authed[ip]) {
        if (Date.now() >= authed[ip]) {
          delete authed[ip]
          return
        } else {
          authed[ip] = Date.now() + timeout
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

    this.app.post('/admin-login', jsonParser, (req, res) => {
      if (!req.body) return res.sendStatus(400)

      let ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

      let user = this.users('account').find({user: req.body.user}) || {}

      pw.verify(user.hash, req.body.pass, (err, isValid) => {
        if (err) throw err

        if (isValid) {
          authed[ip] = Date.now() + timeout
          res.sendStatus(200)
        } else {
          res.sendStatus(400)
        }
      })
    })

    this.app.post('/admin-add', jsonParser, (req, res) => {
      if (!req.body) return res.sendStatus(400)

      let ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress

      if (authed[ip]) {
        if (Date.now() >= authed[ip]) {
          delete authed[ip]
          return
        } else {
          authed[ip] = Date.now() + timeout
        }
      } else if (this.users('account').find({})) {
        return res.sendStatus(403)
      }

      pw.hash(req.body.pass, (err, hash) => {
        if (err) throw err

        this.users('account').push({
          user: req.body.user,
          hash: hash
        })

        res.sendStatus(200)
      })
    })

    this.app.get('/data-pages', (req, res) => {
      res.json(this.config)
    })
  }
}

module.exports = CMS

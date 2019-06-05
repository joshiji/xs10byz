const sendJson = require('send-data/json')
const body = require('body/json')

const redis = require('../src/redis')

const redisClient = redis()

module.exports = {
  postBuyer,
  getBuyer,
  getRoute
}

function postBuyer (req, res, opts, cb) {
  body(req, res, (err, data) => {
    if (err) {
      if (err.name === 'SyntaxError') {
        err.statusCode = 422
      }
      return cb(err)
    }

    redisClient.set(data.id, JSON.stringify(data), (err, reply) => {
      if (err) return cb(err)

      res.statusCode = 201
      sendJson(req, res, data)
    })
  })
}

function getBuyer (req, res, opts, cb) {
  redisClient.get(opts.params.id, (err, reply) => {
    if (err) return cb(err)

    if (reply) {
      sendJson(req, res, JSON.parse(reply))
    }
  })
}

function getRoute (req, res, opts, cb) {
  const date = new Date(opts.params.timestamp)
  sendJson(req, res, {
    'statusCode': 302,
    'headers': {
      'location': 'DummyLocation'
    }
  })
}

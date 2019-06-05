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
  body(req, res, (err, buyer) => {
    if (err) {
      if (err.name === 'SyntaxError') {
        err.statusCode = 422
      }
      return cb(err)
    }

    redisClient.set(buyer.id, JSON.stringify(buyer), (err, reply) => {
      if (err) return cb(err)

      const redisMulti = redisClient.multi()

      buyer.offers.forEach((offer) => {
        for (let key in offer.criteria) {
          offer.criteria[key].forEach(value => {
            redisMulti.zadd([`${key}:${value}`, offer.value, offer.location])
          })
        }
      })

      redisMulti.exec((err, reply) => {
        if (err) return cb(err)

        res.statusCode = 201
        sendJson(req, res, buyer)
      })
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
  const date = new Date(opts.query.timestamp)
  const hour = date.getUTCHours()
  const day = date.getUTCDay()

  const sets = [`device:${opts.query.device}`,
    `state:${opts.query.state}`,
    `hour:${hour}`,
    `day:${day}`]

  const redisMulti = redisClient.multi()

  redisMulti.zinterstore(['tempHolder', sets.length, ...sets])
  redisMulti.zrevrange(['tempHolder', 0, -1])

  redisMulti.exec((err, reply) => {
    if (err) return cb(err)

    sendJson(req, res, {
      'statusCode': 302,
      'headers': {
        'location': reply[1][0]
      }
    })
  })
}

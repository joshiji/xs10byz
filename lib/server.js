const URL = require('url')
const http = require('http')
const Corsify = require('corsify')
const sendJson = require('send-data/json')
const HttpHashRouter = require('http-hash-router')

const api = require('./api')

const router = HttpHashRouter()
const cors = Corsify({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, accept, content-type'
})

router.set('/buyers', { POST: api.postBuyer })
router.set('/buyers/:id', { GET: api.getBuyer })
router.set('/route', { GET: api.getRoute })

module.exports = function createServer () {
  return http.createServer(cors(handler))
}

function handler (req, res) {
  router(req, res, {query: getQuery(req.url)}, onError.bind(null, req, res))
}

function onError (req, res, err) {
  if (!err) return

  res.statusCode = err.statusCode || 500

  sendJson(req, res, {
    error: err.message || http.STATUS_CODES[res.statusCode]
  })
}

function getQuery (url) {
  return URL.parse(url, true).query
}

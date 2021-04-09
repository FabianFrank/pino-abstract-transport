'use strict'

const metadata = Symbol.for('pino.metadata')
const split = require('split2')

module.exports = function build (fn, opts = {}) {
  const stream = split(function (line) {
    let value

    try {
      value = JSON.parse(line)
    } catch (error) {
      this.emit('unknown', line, error)
      return
    }

    if (value === null) {
      this.emit('unknown', line, 'Null value ignored')
      return
    }

    if (typeof value !== 'object') {
      value = {
        data: value,
        time: new Date().toISOString()
      }
    }

    if (stream[metadata]) {
      stream.lastTime = value.time
      stream.lastLevel = value.level
      stream.lastObj = value
    }

    return value
  })

  if (opts.metadata) {
    stream[metadata] = true
    stream.lastTime = 0
    stream.lastLevel = 0
    stream.lastObj = null
  }

  let res = fn(stream)

  if (res && typeof res.catch === 'function') {
    res.catch((err) => {
      stream.destroy(err)
    })

    // set it to null to not retain a reference to the promise
    res = null
  }

  return stream
}
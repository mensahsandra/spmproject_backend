const levels = ['debug','info','warn','error'];

function base(level, msg, meta) {
  const record = Object.assign({
    level,
    msg,
    time: new Date().toISOString()
  }, meta || {});
  const line = JSON.stringify(record);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

const logger = {
  debug: (msg, meta) => base('debug', msg, meta),
  info: (msg, meta) => base('info', msg, meta),
  warn: (msg, meta) => base('warn', msg, meta),
  error: (msg, meta) => base('error', msg, meta)
};

module.exports = logger;

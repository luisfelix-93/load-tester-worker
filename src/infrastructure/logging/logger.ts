import winston from 'winston';

// Define os níveis de severidade do log, padrão do npm.
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Define as cores para cada nível no console
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};
winston.addColors(colors);

// Formato para os logs em arquivo: Timestamp + JSON
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
);

// Formato para os logs no console: Colorido e simples
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);


const transports = [
  // O transporte de console é útil para desenvolvimento
  new winston.transports.Console({ format: consoleFormat }),
  
  // O transporte de arquivo irá gerar os logs que o Promtail irá ler
  new winston.transports.File({
    filename: 'logs/app.log',
    format: fileFormat
  }),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: fileFormat
  })
];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports
});

export default logger;

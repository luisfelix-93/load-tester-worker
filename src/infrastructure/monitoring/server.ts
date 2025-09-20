import express from 'express';
import { register } from './metrics';
import logger from '../logging/logger';

const app = express();

/**
 * Inicia um servidor Express para expor as métricas do Prometheus.
 */
export const startMetricsServer = () => {
  // Limpa qualquer métrica que possa ter sido registrada anteriormente (útil para dev com hot-reload)
  register.clear();

  // Define o endpoint /metrics que o Prometheus irá acessar
  app.get('/metrics', async (req, res) => {
    try {
      // Define o Content-Type para o formato que o Prometheus espera
      res.set('Content-Type', register.contentType);
      // Envia as métricas coletadas
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  });

  // A porta 9100 é comumente usada para exporters customizados do Prometheus
  const port = parseInt(process.env.METRICS_PORT || '9100', 10);
  
  app.listen(port, () => {
    logger.info(`📈 Servidor de métricas rodando em http://localhost:${port}/metrics`);
  });
};

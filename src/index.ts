import { Worker } from 'bullmq';
import { Config } from './infrastructure/config';
import { LoadTestProcessor } from './infrastructure/jobs/loadTest.processor';
import { loadTestResultsQueue } from './infrastructure/jobs/queue';
import { startMetricsServer } from './infrastructure/monitoring/server';
import logger from './infrastructure/logging/logger';

/**
 * Função principal para encapsular a inicialização do worker.
 * Isso nos permite usar async/await no nível superior e tratar erros de inicialização.
 */
async function main() {
    logger.info('▶️  Iniciando o worker de teste de carga...');

    // Inicia o servidor de métricas para o Prometheus
    startMetricsServer();

    // 1. Injeção de Dependência: Instanciamos as classes necessárias.
    const loadTestProcessor = new LoadTestProcessor(loadTestResultsQueue);

    // 2. Conexão com o Redis: Define os detalhes da conexão para o BullMQ.
    const connection = {
        host: Config.redis.host,
        port: Config.redis.port,
    };

    // 3. Criação do Worker:
    const worker = new Worker(
        Config.queues.loadTestJobs,
        loadTestProcessor.loadTestProcessor.bind(loadTestProcessor),
        {
            connection,
            lockDuration: 120000 // 2 minutos
        }
    );

    // 4. Listeners de Eventos (para monitoramento e depuração)
    worker.on('completed', (job) => {
        logger.info(`✅ Job #${job.id} concluído com sucesso.`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`❌ Job #${job?.id} falhou.`, { error: err.message, jobId: job?.id });
    });

    // 5. Mensagem de Inicialização
    logger.info(`🚀 Worker está rodando e escutando a fila: "${Config.queues.loadTestJobs}"`);
    logger.info('   Aguardando por novos jobs...');
}

// Executa a função principal e captura qualquer erro que possa ocorrer durante a inicialização.
main().catch(err => {
    logger.error('💥 Falha ao iniciar o worker:', { error: err });
    process.exit(1); // Encerra o processo com um código de erro
});

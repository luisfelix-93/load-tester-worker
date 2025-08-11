import { Worker } from 'bullmq';
import { Config } from './infrastructure/config';
import { LoadTestProcessor } from './infrastructure/jobs/loadTest.processor';
import { loadTestResultsQueue } from './infrastructure/jobs/queue';
import { RunLoadTestUseCase } from './services/runLoadTest.usecase';

/**
 * Função principal para encapsular a inicialização do worker.
 * Isso nos permite usar async/await no nível superior e tratar erros de inicialização.
 */
async function main() {
    console.log('▶️  Iniciando o worker de teste de carga...');

    // 1. Injeção de Dependência: Instanciamos as classes necessárias.
    // O Processor depende do UseCase, então criamos o UseCase primeiro.
    const runLoadTestUseCase = new RunLoadTestUseCase();
    const loadTestProcessor = new LoadTestProcessor(runLoadTestUseCase, loadTestResultsQueue);

    // 2. Conexão com o Redis: Define os detalhes da conexão para o BullMQ.
    const connection = {
        host: Config.redis.host,
        port: Config.redis.port,
    };

    // 3. Criação do Worker:
    //    - O primeiro argumento é o nome da fila que ele vai escutar.
    //    - O segundo é a função que processará cada job.
    //      Usamos .bind() para garantir que o 'this' dentro do método
    //      seja a instância correta de 'loadTestProcessor'.
    //    - O terceiro são as opções, incluindo a conexão.
    const worker = new Worker(
        Config.queues.loadTestJobs,
        loadTestProcessor.loadTestProcessor.bind(loadTestProcessor),
        { connection }
    );

    // 4. Listeners de Eventos (para monitoramento e depuração)
    worker.on('completed', (job) => {
        console.log(`✅ Job #${job.id} concluído com sucesso.`);
    });

    worker.on('failed', (job, err) => {
        // O erro já é logado no processador, mas podemos adicionar um log aqui também
        // para indicar que o worker marcou o job como falho.
        console.error(`❌ Job #${job?.id} falhou. Erro: ${err.message}`);
    });

    // 5. Mensagem de Inicialização
    console.log(`🚀 Worker está rodando e escutando a fila: "${Config.queues.loadTestJobs}"`);
    console.log('   Aguardando por novos jobs...');
}

// Executa a função principal e captura qualquer erro que possa ocorrer durante a inicialização.
main().catch(err => {
    console.error('💥 Falha ao iniciar o worker:', err);
    process.exit(1); // Encerra o processo com um código de erro
});

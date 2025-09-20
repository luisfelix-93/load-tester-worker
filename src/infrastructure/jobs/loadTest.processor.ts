import { Job, Queue } from "bullmq";
import { ILoadData } from "../types/ILoadData";
import { Worker, WorkerOptions } from 'worker_threads';
import * as path from 'path';
import { activeJobsGauge, jobDurationHistogram, jobsProcessedCounter } from "../monitoring/metrics";
import logger from "../logging/logger";

export interface ILoadTestProcessor {
    loadTestProcessor(job: Job<ILoadData>): Promise<any>;
}

export class LoadTestProcessor implements ILoadTestProcessor {
    constructor(
        private readonly resultsQueue: Queue,
    ){}

    async loadTestProcessor(job: Job<ILoadData>): Promise<any> {
        logger.info(`✅ Despachando job #${job.id} para um worker thread.`, {
            jobId: job.id,
            testId: job.data.testId,
            targetUrl: job.data.targetUrl
        });
        
        activeJobsGauge.inc(); // Aumenta o medidor de jobs ativos
        const endTimer = jobDurationHistogram.startTimer(); // Inicia o timer de duração

        try {
            const loadTestResult = await new Promise((resolve, reject) => {
                const isTestEnv = process.env.NODE_ENV === 'test';
                const workerFile = isTestEnv ? 'loadTest.worker.ts' : 'loadTest.worker.js';
                const workerPath = path.join(__dirname, '..', 'workers', workerFile);

                const workerOptions: WorkerOptions = {
                    workerData: job.data
                };

                if (isTestEnv) {
                    workerOptions.execArgv = ['-r', 'ts-node/register'];
                }
                
                const worker = new Worker(workerPath, workerOptions);

                worker.on('message', (message) => {
                    if (message.success) {
                        resolve(message.data);
                    } else {
                        reject(new Error(message.error));
                    }
                });

                worker.on('error', reject);

                worker.on('exit', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Worker thread parou com exit code ${code}`));
                    }
                });
            });

            await this.resultsQueue.add('result', loadTestResult);
            logger.info(`📦 Job #${job.id} finalizado e resultado enviado para a fila de resultados.`);
            
            jobsProcessedCounter.inc({ status: 'success' }); // Incrementa o contador de sucesso
            
            return loadTestResult;
        } catch (error: any) {
            logger.warn(`⚠️ Erro ao processar job #${job.id} no worker thread.`, {
                jobId: job.id,
                testId: job.data.testId,
                error: error.message,
            });

            jobsProcessedCounter.inc({ status: 'failure' }); // Incrementa o contador de falha

            throw error;
        } finally {
            endTimer(); // Finaliza o timer de duração, registrando o tempo
            activeJobsGauge.dec(); // Diminui o medidor de jobs ativos
        }
    }
}
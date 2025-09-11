import { Job, Queue } from "bullmq";
import { ILoadData } from "../types/ILoadData";
import { Worker, WorkerOptions } from 'worker_threads';
import * as path from 'path';

export interface ILoadTestProcessor {
    loadTestProcessor(job: Job<ILoadData>): Promise<any>;
}

export class LoadTestProcessor implements ILoadTestProcessor {
    constructor(
        private readonly resultsQueue: Queue,
    ){}

    async loadTestProcessor(job: Job<ILoadData>): Promise<any> {
        console.log(`✅ Despachando job #${job.id} para um worker thread. URL: ${job.data.targetUrl}, teste ID: ${job.data.testId}`);

        try {
            const loadTestResult = await new Promise((resolve, reject) => {
                const isTestEnv = process.env.NODE_ENV === 'test';
                const workerFile = isTestEnv ? 'loadTest.worker.ts' : 'loadTest.worker.js';
                const workerPath = path.join(__dirname, '..', 'workers', workerFile);

                const workerOptions: WorkerOptions = {
                    workerData: job.data
                };

                // Se estiver no ambiente de teste, precisamos registrar o ts-node para o worker
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
            console.log(`📦 Job #${job.id} finalizado pelo worker e resultado enviado para a fila de resultados.`);
            return loadTestResult;
        } catch (error: any) {
            console.warn(`⚠️ Erro ao processar job #${job.id} no worker thread.`, {
                jobId: job.id,
                testId: job.data.testId,
                error: error.message,
            });
            throw error;
        }
    }
}
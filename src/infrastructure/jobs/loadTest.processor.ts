import { Job, Queue } from "bullmq";
import { ILoadData } from "../types/ILoadData";
import { IRunLoadTestUseCase } from "../../services/runLoadTest.usecase";

export interface ILoadTestProcessor {
    loadTestProcessor(job: Job<ILoadData>): Promise<void>;
}

export class LoadTestProcessor implements ILoadTestProcessor {
    constructor(
        private readonly useCase: IRunLoadTestUseCase,
        private readonly resultsQueue: Queue,
    ){}

    async loadTestProcessor(job: Job<ILoadData>): Promise<void> {
        const {
            testId,
            targetUrl,
            numRequests,
            concurrency,
            method,
            payload,
            headers,
            timeout
        } = job.data;

        // Garante valores padrão para as propriedades opcionais
        const executionMethod = method ?? 'GET';
        const executionHeaders = headers ?? {};
        const executionPayload = payload ?? null;
        const executionTimeout = timeout ?? 10000; // Ex: 10 segundos de timeout padrão

        console.log(`✅ Processando job #${job.id} para a URL: ${targetUrl}, teste ID: ${testId}`);
        try {
            const loadTest = await this.useCase.execute(
                testId,
                targetUrl,
                numRequests,
                concurrency,
                executionMethod,
                executionPayload,
                executionHeaders,
                executionTimeout
            );

            await this.resultsQueue.add('result', loadTest);
            console.log(`📦 Job #${job.id} finalizado e resultado enviado para a fila de resultados.`);
        } catch (error: any) {
            console.warn(`⚠️ Erro ao processar job #${job.id}. O job falhou e será tentado novamente se configurado.`, {
                jobId: job.id,
                testId: job.data.testId,
                error: error.message,
            });
            throw error;
        }
    }
}
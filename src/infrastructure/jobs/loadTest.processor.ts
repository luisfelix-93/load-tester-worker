import { Job } from "bullmq";
import { ILoadData } from "../types/ILoadData";
import { IRunLoadTestUseCase } from "../../services/runLoadTest.usecase";
import { loadTestResultsQueue } from "./queue";

export interface ILoadTestProcessor {
    loadTestProcessor(job: Job<ILoadData>): Promise<void>;
}

export class LoadTestProcessor implements ILoadTestProcessor {
    constructor(private readonly useCase: IRunLoadTestUseCase){}

    async loadTestProcessor(job: Job<ILoadData>): Promise<void> {
        const {
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

        console.log(`✅ Processando job #${job.id} para a URL: ${targetUrl}`)
        try {
            const loadTest = await this.useCase.execute(
                targetUrl,
                numRequests,
                concurrency,
                executionMethod,
                executionPayload,
                executionHeaders,
                executionTimeout
            );
    
            await loadTestResultsQueue.add('result', loadTest);
            console.log(`📦 Job #${job.id} finalizado e resultado enviado para a fila de resultados.`);
        } catch (error) {
            
            console.error(`❌ Erro ao processar job #${job.id}.`, {
                jobId: job.id,
                jobData: job.data,
                error: error,
            });
            throw error;
        }
    }
}
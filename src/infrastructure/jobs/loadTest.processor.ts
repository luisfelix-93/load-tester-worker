import { Job } from "bullmq";
import { ILoadData } from "../types/ILoadData";
import { IRunLoadTestUseCase } from "../../services/runLoadTest.usecase";
import { loadTestResultsQueue } from "./queue";

export interface ILoadTestProcessor {
    loadTestProcessor(job: Job<ILoadData>): Promise<void | null>;
}

export class LoadTestProcessor implements ILoadTestProcessor {
    constructor(private readonly useCase: IRunLoadTestUseCase){}

    async loadTestProcessor(job: Job<ILoadData>): Promise<void | null> {
        const {
            targetUrl,
            numRequests,
            concurrency,
            method,
            payload,
            headers,
            timeout
        } = job.data;

        console.log(`✅ Processando job #${job.id} para a URL: ${targetUrl}`)
        const loadTest = await this.useCase.execute(
            targetUrl,
            numRequests,
            concurrency,
            method,
            payload,
            headers,
            timeout
        );

        await loadTestResultsQueue.add('result', loadTest);
    }
}
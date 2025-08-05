export interface ILoadData {
    targetUrl: string,
    numRequests: number,
    concurrency: number,
    method?: string,
    payload?: any,
    headers?: Record<string, string>,
    timeout?: number
}
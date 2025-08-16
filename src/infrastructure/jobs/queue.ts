import { Queue } from "bullmq";
import { Config } from "../config";

const connection = {
    host: Config.redis.host,
    port: Config.redis.port,
};


export const loadTestResultsQueue = new Queue(Config.queues.loadTestResults, { 
    connection
 });
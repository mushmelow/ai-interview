import { Pool, QueryResult } from 'pg';

export interface DatabaseQueryResult<T = any> extends QueryResult<T> { }

export declare const pool: Pool;
export declare const query: <T = any>(text: string, params?: any[]) => Promise<DatabaseQueryResult<T>>;
export declare const testConnection: () => Promise<boolean>;
export declare const closePool: () => Promise<void>;



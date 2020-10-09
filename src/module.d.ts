export interface Config {
    readonly rootURL: string;
    readonly cachePath: string; // cache folder
    readonly output: string; // output file name
}

export interface MatchGroups {
    readonly [key: string]: string;
}

export interface CalingCodeModel {
    readonly code2: string; // alpha-2 code
    readonly code3: string; // alpha-3 code
    readonly code: string; // calling code
}
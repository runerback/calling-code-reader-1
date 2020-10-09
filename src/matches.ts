import { MatchGroups } from "./module";

export default function* iterator(pattern: string | RegExp, flags: string[], content: string): IterableIterator<MatchGroups> {
    const exp = new RegExp(pattern, flags.join(''));

    let match = exp.exec(content);

    while (match && match.groups) {
        yield match.groups;

        match = exp.exec(content);
    }
}
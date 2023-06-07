import {StateMachine} from "../expressions/StateMachine";
import {TuringMachine} from "../expressions/TuringMachine";
import {PushdownMachine} from "../expressions/PushdownMachine";
import {Grammar} from "../expressions/Grammar";
import {loadStateMachine} from "./StateMachineLoader";
import {loadTuringMachine} from "./TuringMachineLoader";
import {loadPushdownMachine} from "./PushdownMachineLoader";
import {loadGrammar} from "./GrammarLoader";
import {Expression} from "../expressions/Expression";
import {Graph} from "../expressions/Graph";
import {toArray} from "../common";

type ExpressionValue = StateMachine | PushdownMachine | TuringMachine | Grammar;

function loadYaml(code: string): ExpressionValue | null {
    if (code.startsWith("StateMachine")) {
        return loadStateMachine(code);
    } else if (code.startsWith("TuringMachine")) {
        return loadTuringMachine(code);
    } else if (code.startsWith("PushdownMachine")) {
        return loadPushdownMachine(code);
    } else if (code.startsWith("Grammar")) {
        return loadGrammar(code);
    }

    return null;
}

export function loadExpression(codes: string[], index: number): ExpressionValue | null {
    let code = codes[index];

    //code contains just whitespaces
    if (code.replace(/\s/g, "").length === 0) return null;

    let result = loadYaml(code);

    if (result !== null) return result;

    let thisCleanCode = Expression.cleanCode(code);

    if (thisCleanCode === null) throw new Error("Invalid expression");

    let graph = new Graph("graph")
    let exprNames = new Map<number, string>();

    let cleanCodes = codes
        .map(c => Expression.cleanCode(c));

    for(let i = 0; i < codes.length; i++) {
        let c = codes[i];

        let exprValue = loadYaml(c);
        if (exprValue !== null) {
            graph.addNode(exprValue.name);
            exprNames.set(i, exprValue.name);
            break;
        }

        let cleanCode = cleanCodes[i];


        if (cleanCode !== null) {
            graph.addNode(cleanCode.name)
            exprNames.set(i, cleanCode.name);
        }
    }

    cleanCodes.forEach((code) => {
        if (code === null) return;

        Expression.getDependencies(code.code, graph.nodes).forEach(d => {
            graph.addEdge(code.name, d);
        });

    });

    let circle = graph.circleFrom(thisCleanCode.name);

    if (circle !== null) {
        throw new Error("Circular dependency detected width: "+ toArray(circle).sort().join(", "));
    }

    let sorted = graph.topologicalSort();

    console.log(sorted);

    return null;
}
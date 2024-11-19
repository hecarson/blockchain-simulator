import { ChangeEvent, useState } from "react";
import { Simulator, ISimulatorLogger } from "./simulator";

export default function Test() {
    const [log, setLog] = useState<string[]>([]);
    // This is necessary because setLog does not immediately update log; it only requests a rerender
    const [newLog] = useState<string[]>([]);
    function getLogger(newLog: string[]): ISimulatorLogger {
        return {
            info(m) {
                newLog.push(m);
            },
            error(m) {
                newLog.push(m);
            },
        };
    }
    const [simulator] = useState(
        // Use arrow function to avoid constructing redundant Simulators on each render
        () => new Simulator(getLogger(newLog))
    );

    function updateLog() {
        setLog([...log, ...newLog]);
        newLog.length = 0; // Clear array
    }

    function clearLog() {
        setLog([]);
    }

    return (
        <div className="flex flex-col p-4 gap-4 items-center">
            <h1 className="mb-4">Test page</h1>
            <Controls simulator={simulator} updateLog={updateLog} clearLog={clearLog} />
            <Log log={log} />
        </div>
    );
}

function Controls(
    { simulator, updateLog, clearLog } :
    { simulator: Simulator, updateLog: () => void, clearLog: () => void }
) {
    const [initScript, setInitScript] = useState(
        "logger.info(\"hello from init!\");\n" +
        "logger.error(\"error from init!\");"
    );

    function onInitScriptChange(event: ChangeEvent<HTMLTextAreaElement>) {
        setInitScript(event.target.value);
    }

    function onInitClick() {
        simulator.init(initScript);
        updateLog();
    }

    function onClearClick() {
        clearLog();
    }

    return (
        <div className="flex flex-col gap-2 items-center w-1/3">
            <textarea value={initScript} onChange={onInitScriptChange} className="w-full h-40" />
            <div className="flex flex-row gap-4">
                <button onClick={onInitClick}>init</button>
                <button onClick={onClearClick}>clear</button>
            </div>
        </div>
    );
}

function Log({ log } : { log: string[] }) {
    return (
        <div className="flex flex-col border-2 w-1/3 p-2">
            { log.map((entry, index) => <div key={index}>{entry}</div>) }
        </div>
    );
}

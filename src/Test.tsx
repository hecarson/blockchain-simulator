import { useState } from "react";
import { Simulator, ISimulatorLogger } from "./simulator";

const simulator = new Simulator();

export default function Test() {
    const [log, setLog] = useState([] as string[]);
    // This is necessary because setLog does not immediately update log; it only requests a rerender
    const newLogEntries = [] as string[];
    const logger: ISimulatorLogger = {
        info(m) {
            newLogEntries.push(m);
        },
        error(m) {
            newLogEntries.push(m);
        },
    };
    simulator.setLogger(logger);

    function updateLog() {
        setLog([...log, ...newLogEntries]);
    }

    function clearLog() {
        setLog([]);
    }

    return (
        <div className="flex flex-col gap-4 items-center">
            <h1 className="mb-4">Test page</h1>
            <Controls updateLog={updateLog} clearLog={clearLog} />
            <Log log={log} />
        </div>
    );
}

function Controls(
    { updateLog, clearLog } :
    { updateLog: () => void, clearLog: () => void }
) {
    const [initScript, setInitScript] = useState(
        "logger.info(\"hello from init!\");\n" +
        "logger.error(\"error from init!\");"
    );

    function onInitScriptChange(event: any) {
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
            <textarea value={initScript} onChange={onInitScriptChange} className="w-full" />
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
            { log.map((entry) => <div>{entry}</div>) }
        </div>
    );
}

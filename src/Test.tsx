import { useState } from "react";
import { Simulator, ILogger } from "./simulator";

export default function Test() {
    const [log, setLog] = useState([] as string[]);
    // This is necessary because setLog does not immediately update log; it only requests a rerender
    const newLogEntries = [] as string[];

    const logger: ILogger = {
        info(m) {
            newLogEntries.push(`[INFO] ${m}`);
        },
        error(m) {
            newLogEntries.push(`[ERROR] ${m}`);
        },
    };

    const initScript = "logger.info(\"hello from init!\"); logger.error(\"an error from init!\");";

    const simulator = new Simulator(logger);

    function onInitClick() {
        simulator.init(initScript);
        setLog([...log, ...newLogEntries]);
    }

    return (
        <div className="flex flex-col">
            <h1>Test page</h1>
            <button onClick={onInitClick}>init</button>
            { log.map((entry) => <div>{entry}</div>) }
        </div>
    );
}

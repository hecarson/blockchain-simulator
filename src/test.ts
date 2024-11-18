// This file is meant to be run locally in node for quick tests independent of react.
// pnpx tsx test.ts

//import { Simulator, Node, ILogger } from "./simulator";
import { Simulator, ISimulatorLogger } from "./simulator";

const logger: ISimulatorLogger = {
    info(m) {
        console.log(m);
    },
    error(m) {
        console.log(m);
    },
};

const initScript = "logger.info(\"hello from init!\"); logger.error(\"error from init!\");";

const sim = new Simulator(logger);
const initSuccess = sim.init(initScript);
console.log(`success: ${initSuccess}`);

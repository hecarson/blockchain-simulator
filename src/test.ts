// This file is meant to be run locally in node for quick tests independent of react.
// pnpx tsx test.ts

//import { Simulator, Node, ILogger } from "./simulator";
import { Simulator, ILogger } from "./simulator";

const logger: ILogger = {
    info(m) {
        console.log(`[INFO] ${m}`);
    },
    error(m) {
        console.log(`[ERROR] ${m}`);
    },
};

const initScript = "logger.info(\"hello from init!\"); logger.error(\"error from init!\");";

const sim = new Simulator();
sim.setLogger(logger);
const initSuccess = sim.init(initScript);
console.log(`success: ${initSuccess}`);

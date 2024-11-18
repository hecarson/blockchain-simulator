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

const sim = new Simulator(logger);
const initSuccess = sim.init(initScript);
console.log(`success: ${initSuccess}`);

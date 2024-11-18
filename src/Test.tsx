import { Simulator, ILogger } from "./simulator";

export default function Test() {
    const logger: ILogger = {
        info(m) {
            alert(`[INFO] ${m}`);
        },
        error(m) {
            alert(`[ERROR] ${m}`);
        },
    };

    const initScript = "logger.info(\"hello from init!\");";

    const simulator = new Simulator(logger);
    simulator.init(initScript);

    return (
        <>
            <h1>Test page</h1>
        </>
    );
}

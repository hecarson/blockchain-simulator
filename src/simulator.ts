import { MinPriorityQueue } from "@datastructures-js/priority-queue";



// Public code

export class Simulator {

    nodes: SimulatorNode[] = [];
    eventQueue: MinPriorityQueue<SimulatorEvent>;
    logger?: ILogger;
    curTime = 0;

    /**
     * Initializes an empty simulator.
     */
    constructor() {
        console.log("constructing Simulator");

        // Order events by time
        this.eventQueue = new MinPriorityQueue<SimulatorEvent>(
            (e: SimulatorEvent) => e.time
        );
    }

    /**
     * Clears the simulator and runs the init script to initialize a new simulator.
     * Returns whether the init script ran successfully.
     *
     * An init script is given two parameters:
     * * simulator: Simulator
     * * logger: ILogger
     */
    init(initScript: string): boolean {
        this.nodes = [];
        this.eventQueue.clear();
        this.curTime = 0;

        const initFunction = new Function("simulator", "logger", initScript);
        try {
            initFunction(this, this.logger);
        }
        catch (e) {
            console.log(e);
            return false;
        }

        return true;
    }

    /**
     * Sets the logger.
     *
     * This is useful because a logger in a React component can be defined after
     * the initialization of the simulator.
     */
    setLogger(logger: ILogger) {
        this.logger = logger;
    }

}

export class SimulatorNode {
    id: number;
    peers: number[] = [];
    simulator: Simulator

    handleEvent: IEventHandler;

    private static nextId = 0;

    constructor(simulator: Simulator, handleEvent: IEventHandler) {
        this.id = SimulatorNode.nextId;
        SimulatorNode.nextId++;
        this.simulator = simulator;
        this.handleEvent = handleEvent;
    }

    sendMessage(): void {
    }
}

export type SimulatorEvent = {
    time: number;
}

export interface ILogger {
    info: (m: string) => void;
    error: (m: string) => void;
}

export interface IEventHandler {
    (event: SimulatorEvent): void;
}



// Internal code



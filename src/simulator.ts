import { MinPriorityQueue } from "@datastructures-js/priority-queue";



// Public code

export class Simulator {

    nodes: SimulatorNode[] = [];
    eventQueue: MinPriorityQueue<SimulatorEvent>;
    curTime = 0;
    private tagLogger: TagLogger;

    /**
     * Initializes an empty simulator.
     */
    constructor(logger: ISimulatorLogger) {
        console.log("constructing Simulator");

        // Order events by time
        this.eventQueue = new MinPriorityQueue<SimulatorEvent>(
            (e: SimulatorEvent) => e.time
        );
        
        this.tagLogger = new TagLogger(logger);
    }

    /**
     * Clears the simulator and runs the init script to initialize a new simulator.
     * Returns whether the init script ran successfully.
     *
     * An init script is given two parameters:
     * * nodes: Node[]
     * * logger: ILogger
     */
    init(initScript: string): boolean {
        this.nodes = [];
        this.eventQueue.clear();
        this.curTime = 0;

        const initFunction = new Function("simulator", "logger", initScript);
        this.tagLogger.time = this.curTime;


        try {
            initFunction(this, this.tagLogger);
        }
        catch (e) {
            console.log(e);
            return false;
        }

        return true;
    }

    /**
     * Creates a new node in the simulator network.
     */
    createNewNode(pos: SimulatorNodePosition, name: string, color: string,
        handleEvent: ISimulatorEventHandler
    ) {
        const node = new SimulatorNode(this, name, color, pos, handleEvent);
        this.nodes.push(node);
        return node;
    }

}


export class SimulatorNode {

    id: number;
    name: string;
    color: string;
    peers: number[] = [];
    /**
     * x and y are fractions from 0 to 1
     */
    pos: SimulatorNodePosition
    handleEvent: ISimulatorEventHandler;
    simulator: Simulator;

    private static nextId = 0;

    constructor(simulator: Simulator, name: string, color: string, pos: SimulatorNodePosition,
        handleEvent: ISimulatorEventHandler)
    {
        this.id = SimulatorNode.nextId;
        SimulatorNode.nextId++;
        this.name = name;
        this.color = color;
        this.pos = pos;
        this.handleEvent = handleEvent;
        this.simulator = simulator;
    }

    createEvent(timeOffset: number, type: string, msg?: object) {
    }

    sendMessage(dst: number, msg: object): void {
    }

}

export type SimulatorEvent = {
    time: number;
    target: number;
    type: string;
    msg?: object;
}

export interface ISimulatorLogger {
    info(m: string): void;
    error(m: string): void;
}

export interface ISimulatorEventHandler {
    (event: SimulatorEvent): void;
}

export type SimulatorNodePosition = {
    x: number,
    y: number
};



// Internal code

/**
 * Intermediate logger that prefixes tags to messages
 */
class TagLogger implements ISimulatorLogger {
    logger: ISimulatorLogger;
    time: number | null = null;

    constructor(logger: ISimulatorLogger) {
        this.logger = logger;
    }

    info(m: string): void {
        this.logger!.info(`[INFO] [t=${this.time}] ${m}`);
    }

    error(m: string): void {
        this.logger!.error(`[ERROR] [t=${this.time}] ${m}`);
    }
}

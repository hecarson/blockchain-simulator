import { MinPriorityQueue } from "@datastructures-js/priority-queue";



// Public code

export class Simulator {

    nodes: { [id: number]: SimulatorNode } = {}
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
        this.nodes = {};
        this.eventQueue.clear();
        this.curTime = 0;
        this.tagLogger.time = this.curTime;

        try {
            const initFunction = new Function("simulator", "logger", initScript);
            initFunction(this, this.tagLogger);
        }
        catch (e) {
            console.log(e);
            return false;
        }

        return true;
    }

    /**
     * Creates a new node in the simulator network. Nodes should only be created with this function.
     */
    createNewNode(id: number, name: string, pos: SimulatorNodePosition, color: string, peers: number[],
        handleEvent: ISimulatorEventHandler
    ) {
        const node = new SimulatorNode(this, id, name, pos, color, peers, handleEvent);
        this.nodes[id] = node;
        return node;
    }

}


export class SimulatorNode {

    id: number;
    name: string;
    /**
     * x and y are fractions from 0 to 1
     */
    pos: SimulatorNodePosition
    color: string;
    peers: number[];
    handleEvent: ISimulatorEventHandler;
    simulator: Simulator;

    constructor(simulator: Simulator, id: number, name: string, pos: SimulatorNodePosition,
        color: string, peers: number[], handleEvent: ISimulatorEventHandler)
    {
        this.simulator = simulator;
        this.id = id;
        this.name = name;
        this.pos = pos;
        this.color = color;
        this.peers = peers;
        this.handleEvent = handleEvent;
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

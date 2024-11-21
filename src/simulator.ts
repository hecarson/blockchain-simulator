import { MinPriorityQueue } from "@datastructures-js/priority-queue";



// Public code

export class Simulator {

    /**
     * Mapping of node IDs to node objects.
     */
    nodes: { [id: number]: SimulatorNode } = {}
    /**
     * Event queue
     */
    eventQueue: MinPriorityQueue<SimulatorEvent>;
    /**
     * Current time of the simulator during event exeuction.
     */
    curTime = 0;
    /**
     * Logger
     */
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
     * * simulator: Simulator
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
     * Intended for init scripts. Creates a new node in the simulator network.
     * Nodes should be created only with this function.
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
    /**
     * Name of node that is displayed on the network graph.
     */
    name: string;
    /**
     * Position of the node in the network graph. x and y are fractions from 0 to 1.
     */
    pos: SimulatorNodePosition
    /**
     * Color of the node in the network graph.
     */
    color: string;
    /**
     * Peer nodes that this node knows about.
     */
    peers: number[];
    /**
     * Event handler for this node. All events are passed to this handler. This is used
     * to implement arbitrary node behavior.
     */
    handleEvent: ISimulatorEventHandler;
    /**
     * This is for internal use and not intended for init scripts.
     * Simulator object that this node belongs to.
     */
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

    /**
     * Creates an event that will be sent to this node after a time delay.
     */
    createEvent(delay: number, type: string, msg?: object) {
    }

    /**
     * Send a message to another node. This creates a message event.
     */
    sendMessage(dst: number, msg: object): void {
    }

}

export type SimulatorEvent = {
    /**
     * Time of when the event is received by the desintation node.
     */
    time: number;
    /**
     * Destination node ID
     */
    dst: number;
    /**
     * Type of event, can be any string. "msg" type is used for message events.
     */
    type: string;
    /**
     * Message data for message events.
     */
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

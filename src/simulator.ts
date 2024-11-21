import { MinPriorityQueue } from "@datastructures-js/priority-queue";



// Public code

export class Simulator {

    /**
     * Mapping of node IDs to node objects. Not intended for use by init scripts.
     */
    nodes: { [id: number]: SimulatorNode } = {}
    /**
     * Event queue. Can be modified by init scripts to pre-add events.
     */
    eventQueue: MinPriorityQueue<SimulatorEvent>;
    /**
     * Current time of the simulator during event execution. Not intended to be modified
     * by init scripts, but init scripts can read this value.
     */
    curTime = 0;
    /**
     * Time delay before a message arrives at its destination node. Can be set by
     * init scripts.
     */
    messageDelay = 3;
    /**
     * Logger for displaying log messages. This is not intended for use in init scripts,
     * since they are already given the logger parameter.
     */
    logger: TagLogger;

    private EMPTY_QUEUE_MSG = "No more events";

    /**
     * Initializes an empty simulator.
     */
    constructor(logger: ISimulatorLogger) {
        console.log("constructing Simulator");

        // Order events by time
        this.eventQueue = new MinPriorityQueue<SimulatorEvent>(
            (e: SimulatorEvent) => e.time
        );
        
        this.logger = new TagLogger(logger, this);
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

        try {
            const initFunction = new Function("simulator", "logger", initScript);
            initFunction(this, this.logger);
        }
        catch (e) {
            console.log(e);
            this.logger.error("Init failed. Check browser console for details.");
            return false;
        }

        this.logger.info("Init successful!");
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

    /**
     * Executes the event at the front of the queue (lowest time) and pause execution.
     * Returns whether execution was successful. Not intended for init scripts.
     */
    stepEvent(): boolean {
        if (this.eventQueue.isEmpty()) {
            this.logger.info(this.EMPTY_QUEUE_MSG);
            return true;
        }

        try {
            this.executeNextEvent();
        }
        catch (e) {
            console.log(e);
            this.logger.error("Step event failed. Check browser console for details.");
            return false;
        }

        return true;
    }

    /**
     * Repeatedly executes events at the front of the queue, until a breakpoint event is hit,
     * a maximum number of events have been executed, or the queue is empty. Returns whether
     * execution was successful. Not intended for init scripts.
     */
    continue(): boolean {
        const MAX_EVENTS_PER_CONTINUE = 1000;
        let numEventsExecuted = 0;

        while (true) {
            if (this.eventQueue.isEmpty()) {
                this.logger.info(this.EMPTY_QUEUE_MSG);
                return true;
            }

            if (numEventsExecuted >= MAX_EVENTS_PER_CONTINUE) {
                this.logger.info(`Executed ${numEventsExecuted} events, pausing`);
                return true;
            }

            try {
                const event = this.eventQueue.front();
                if (event.type === "break" && numEventsExecuted > 0)
                    return true;

                this.executeNextEvent();
                numEventsExecuted++;
            }
            catch (e) {
                console.log(e);
                this.logger.error("Continue failed. Check browser console for details.");
                return false;
            }
        }
    }

    private executeNextEvent() {
        const event = this.eventQueue.pop();
        // Do nothing for breakpoint events
        if (event.type === "break")
            return;
        const node = this.nodes[event.dst];
        this.curTime = event.time;
        node.handleEvent(node, event);
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
     * Intended for use by init scripts. Creates an event that will be sent to this
     * node after a time delay.
     */
    createEvent(delay: number, type: string, msg?: object) {
        const event: SimulatorEvent = {
            time: this.simulator.curTime + delay,
            dst: this.id,
            type: type,
            msg: msg,
        };
        this.simulator.eventQueue.push(event);
    }

    /**
     * Intended for use by init scripts. Send a message to another node.
     * Creates a message event.
     */
    sendMessage(dst: number, msg: object) {
        const event: SimulatorEvent = {
            time: this.simulator.curTime + this.simulator.messageDelay,
            dst: dst,
            type: "msg",
            msg: msg,
        };
        this.simulator.eventQueue.push(event);
    }

    /**
     * Intended for use by init scripts. Broadcast a message to all peers of
     * this node. Creates message events.
     */
    broadcastMessage(msg: object) {
        for (let nextNodeId of this.peers) {
            this.sendMessage(nextNodeId, msg);
        }
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
     * Type of event, can be any string.
     * * "msg" type is used for message events.
     * * "break" type is used for breakpoint events. The simulator will pause before
     *   executing the event and do nothing when executing. The dst ID is ignored for this type.
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
    (node: SimulatorNode, event: SimulatorEvent): void;
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
    simulator: Simulator;

    constructor(logger: ISimulatorLogger, simulator: Simulator) {
        this.logger = logger;
        this.simulator = simulator;
    }

    info(m: string): void {
        this.logger!.info(`[INFO] [t=${this.simulator.curTime}] ${m}`);
    }

    error(m: string): void {
        this.logger!.error(`[ERROR] [t=${this.simulator.curTime}] ${m}`);
    }
}

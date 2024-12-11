// Step-by-step PoS Protocol Simulation with Step Event and Continue functionality

function createEventHandler(nodeId, totalNodes) {
    return function (event) {
        simulator.logger.time = simulator.curTime; // Update logger time to match current simulator time
        simulator.logger.info(`[node${nodeId}] received event:`);
        simulator.logger.info(JSON.stringify(event, null, 2));

        if (event.type === "propose_block") {
            simulator.logger.info(`[node${nodeId}] Proposing a new block`);
            for (let peer of simulator.nodes[nodeId].peers) {
                simulator.eventQueue.enqueue({
                    time: simulator.curTime + 2, // Increase time for each validation event based on current simulator time
                    dst: peer,
                    type: "validate_block",
                    msg: { proposer: nodeId },
                    isBreakpoint: false
                });
            }
            simulator.nodes[nodeId].proposer = nodeId;
            simulator.nodes[nodeId].validationCount = 0;
            simulator.nodes[nodeId].rejectionCount = 0;
        } else if (event.type === "validate_block") {
            simulator.logger.info(`[node${nodeId}] Validating block proposed by Node ${event.msg?.proposer}`);
            const proposerNode = simulator.nodes[event.msg?.proposer];
            if (Math.random() > 0.1) {
                simulator.logger.info(`[node${nodeId}] Block from proposer ${event.msg?.proposer} validated successfully`);
                proposerNode.validationCount = (proposerNode.validationCount || 0) + 1;
            } else {
                simulator.logger.error(`[node${nodeId}] Block from proposer ${event.msg?.proposer} validation failed`);
                proposerNode.rejectionCount = (proposerNode.rejectionCount || 0) + 1;
            }

            // Check for consensus (majority decision)
            if (
                proposerNode.validationCount + proposerNode.rejectionCount === totalNodes - 1 &&
                proposerNode.validationCount > (totalNodes / 2)
            ) {
                simulator.logger.info(`[node${event.msg?.proposer}] Block accepted by consensus.`);
                // Broadcast block acceptance to all nodes
                for (let peer in simulator.nodes) {
                    if (Number(peer) !== event.msg?.proposer) {
                        simulator.eventQueue.enqueue({
                            time: simulator.curTime + 1, // Increase time for broadcasting block acceptance based on current simulator time
                            dst: Number(peer),
                            type: "block_accepted",
                            msg: { proposer: event.msg?.proposer },
                            isBreakpoint: false
                        });
                    }
                }
            } else if (
                proposerNode.validationCount + proposerNode.rejectionCount === totalNodes - 1 &&
                proposerNode.rejectionCount >= (totalNodes / 2)
            ) {
                simulator.logger.error(`[node${event.msg?.proposer}] Block rejected by consensus.`);
            }
        } else if (event.type === "block_accepted") {
            simulator.logger.info(`[node${nodeId}] Block from proposer ${event.msg?.proposer} has been accepted by consensus.`);
            // Store the accepted block to simulate adding it to the blockchain
            if (!simulator.nodes[nodeId].acceptedBlocks) {
                simulator.nodes[nodeId].acceptedBlocks = [];
            }
            simulator.nodes[nodeId].acceptedBlocks.push(event.msg?.proposer);
            simulator.logger.info(`[node${nodeId}] Added block from proposer ${event.msg?.proposer} to the blockchain.`);
        }
    };
}

// Step 1: Initialize Nodes for PoS
const nodes = [];
const totalNodes = 3;
for (let i = 1; i <= totalNodes; i++) {
    nodes.push(simulator.createNewNode(
        i,
        `node${i}`,
        { x: Math.random(), y: Math.random() },
        ["white", "red", "orange"][i - 1],
        Array.from({ length: totalNodes }, (_, j) => j + 1).filter(j => j !== i),
        createEventHandler(i, totalNodes)
    ));
}

// Step 2: Propose a Block
const randomNodeId = Math.ceil(Math.random() * totalNodes);
simulator.logger.info(`Step 1: Node ${randomNodeId} is selected as leader to propose a new block.`);
simulator.eventQueue.enqueue({
    time: simulator.curTime,
    dst: randomNodeId,
    type: "propose_block",
    isBreakpoint: true // Set breakpoint to observe the block proposal step
});

// Use stepEvent or continue for step-by-step or full execution
function stepThroughPoS() {
    simulator.logger.info("Stepping through the PoS protocol...");
    simulator.stepEvent();
}

function continuePoS() {
    simulator.logger.info("Continuing through the PoS protocol...");
    simulator.continue();
}

// Initial Call to Step Through the Process
stepThroughPoS();
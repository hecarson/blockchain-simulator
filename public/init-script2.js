
// Assumptions:
// * All messages have a valid signature and are not forged.
// * All nodes use a unique ID for all new transactions.
// * All nodes will not cheat during validator selection.

// Amount of time between the start of each validation epoch
const EPOCH_INTERVAL = 50;

const good1 = simulator.createNewNode(
    1, "good1", {x: 0.3, y: 0.5}, "teal", [2, 4],
    (node, event) => nodeEventHandler(node, event, false),
);

const good2 = simulator.createNewNode(
    2, "good2", {x: 0.5, y: 0.5}, "teal", [1, 3],
    (node, event) => nodeEventHandler(node, event, false),
);

const good3 = simulator.createNewNode(
    3, "good3", {x: 0.7, y: 0.5}, "teal", [2],
    (node, event) => nodeEventHandler(node, event, false),
);

const bad4 = simulator.createNewNode(
    4, "bad4", { x: 0.5, y: 0.2 }, "maroon", [1],
    (node, event) => nodeEventHandler(node, event, true),
);

simulator.messageDelay = 1;



// Init events
for (let i = 1; i <= 4; i++) {
    simulator.eventQueue.push({
        time: 0, dst: i, type: "init", isBreakpoint: false
    });
}

// Break after init
simulator.eventQueue.push({
    time: 1, dst: 0, type: "break"
});

// Transactions
simulator.eventQueue.push({
    time: 2, dst: 2, type: "msg", msg: {
        type: "transaction",
        transaction: {
            id: 10, src: 1, dst: 2, amount: 10,
        },
    },
});
simulator.eventQueue.push({
    time: 4, dst: 4, type: "msg", msg: {
        type: "transaction",
        transaction: {
            id: 11, src: 4, dst: 3, amount: 20,
        },
    },
});

// Break before first validator selection
simulator.eventQueue.push({
    time: 45, dst: 0, type: "break",
});



// Event handlers

function nodeEventHandler(node, event, bad) {
    if (event.type === "init") {
        handleInitEvent(node);
        return;
    }
    if (event.type === "msg") {
        handleMsg(node, event.msg);
    }
    if (event.type === "selectValidator") {
        handleSelectValidatorEvent(node);
    }
}

function handleInitEvent(node) {
    const initialTransactions = [
        // src of -1 means currency was created
        {id: 1, src: -1, dst: 1, amount: 100},
        {id: 2, src: -1, dst: 2, amount: 100},
        {id: 3, src: -1, dst: 3, amount: 100},
        {id: 4, src: -1, dst: 4, amount: 100},
    ];

    // List of blocks, with initial block
    node.blockchain = [{
        id: 1,
        transactions: initialTransactions,
    }];

    // Map from transaction IDs to objects
    node.mempool = {};
    for (const t of initialTransactions) {
        node.mempool[t.id] = t;
    }

    // Map from node IDs to values to hold other validator random values during validator selection
    node.validatorRandomValues = {};

    // Start validation event loop
    node.createEvent(EPOCH_INTERVAL, "selectValidator");
}

function handleSelectValidatorEvent(node) {
    // Make a random value, save it, and broadcast it
    const randomValue = Math.floor(Math.random() * 100);
    node.validatorRandomValues[node.id] = randomValue;
    node.broadcastMessage({
        type: "validatorRandomValue", src: node.id, value: randomValue,
    });
    node.createEvent(EPOCH_INTERVAL, "selectValidator");
}

function handleMsg(node, msg) {
    if (msg.type === "transaction") {
        handleTransactionMsg(node, msg);
    }
    else if (msg.type === "validatorRandomValue") {
        handleValidatorRandomValueMsg(node, msg);
    }
}

function handleTransactionMsg(node, msg) {
    // Do nothing if transaction is already known
    if (msg.transaction.id in node.mempool)
        return;

    // Save transaction
    node.mempool[msg.transaction.id] = msg.transaction;
    logger.info(`[node${node.id}] saved transaction ${msg.transaction.id}`);

    // Gossip to peers
    node.broadcastMessage({
        type: "transaction", transaction: msg.transaction
    });
}

function handleValidatorRandomValueMsg(node, msg) {
    // Do nothing if value is already known
    if (msg.src in node.validatorRandomValues) {
        return;
    }

    node.validatorRandomValues[msg.src] = msg.value;

    // Gossip to peers
    node.broadcastMessage(msg);
}



function goodEventHandler(node, event) {
    if (event.type === "init") {
        handleInit(node);
        return;
    }
}

function badEventHandler(node, event) {
    if (event.type === "init") {
        handleInit(node);
        return;
    }
}

function handleInit(node) {
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
}

function handleMsg(node, msg) {
    
}



const good1 = simulator.createNewNode(
    1, "good1", {x: 0.3, y: 0.5}, "teal", [2, 4], goodEventHandler
);

const good2 = simulator.createNewNode(
    2, "good2", {x: 0.5, y: 0.5}, "teal", [1, 3], goodEventHandler
);

const good3 = simulator.createNewNode(
    3, "good3", {x: 0.7, y: 0.5}, "teal", [2], goodEventHandler
);

const bad4 = simulator.createNewNode(
    4, "bad4", { x: 0.5, y: 0.2 }, "maroon", [1], badEventHandler
);

simulator.messageDelay = 1;



// Init events
for (let i = 1; i <= 4; i++) {
    simulator.eventQueue.push({
        time: 0, dst: i, type: "init", isBreakpoint: false
    });
}

// Breakpoint
simulator.eventQueue.push({
    time: 1, dst: 0, type: "break"
});

// Transactions
//simulator.eventQueue.push({
//    time: 2, 
//});

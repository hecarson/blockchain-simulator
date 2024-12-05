
// Assumptions:
// * All messages have a valid signature and are not forged.
// * All nodes use a unique ID for all new transactions.
// * All nodes will not cheat during validator selection.
// * All nodes know the correct public key of every other node.

// Amount of time between the start of each validation epoch
const EPOCH_INTERVAL = 100;
const NUM_NODES = 4;

const good1 = await simulator.createNewNode(
   1, "good1", {x: 0.3, y: 0.3}, "teal", [2, 3],
    async (node, event) => await nodeEventHandler(node, event, false),
);

const good2 = await simulator.createNewNode(
    2, "good2", {x: 0.7, y: 0.3}, "teal", [1, 4],
    async (node, event) => await nodeEventHandler(node, event, false),
);

const good3 = await simulator.createNewNode(
    3, "good3", {x: 0.3, y: 0.7}, "teal", [1, 4],
    async (node, event) => await nodeEventHandler(node, event, false),
);

const bad4 = await simulator.createNewNode(
    4, "bad4", { x: 0.7, y: 0.7 }, "maroon", [2, 3],
    async (node, event) => await nodeEventHandler(node, event, false),
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
    time: 99, dst: 0, type: "break",
});

// Break before second validator selection
simulator.eventQueue.push({
    time: 199, dst: 0, type: "break",
});



// Event handlers

async function nodeEventHandler(node, event, isBad) {
    if (event.type === "init") {
        handleInitEvent(node);
    }
    if (event.type === "msg") {
        if (event.msg.type === "transaction") {
            await handleTransactionMsg(node, event.msg);
        }
        else if (event.msg.type === "validatorRandomCommit") {
            // TODO
            await handleValidatorRandomValueMsg(node, event.msg);
        }
        else if (event.msg.type === "block") {
            await handleBlockMsg(node, event.msg);
        }
    }
    if (event.type === "selectValidator") {
        await handleSelectValidatorEvent(node);
    }
}

function handleInitEvent(node) {
    const initialTransactions = {
        // src of -1 means currency is newly created
        1: {id: 1, src: -1, dst: 1, amount: 100},
        2: {id: 2, src: -1, dst: 2, amount: 100},
        3: {id: 3, src: -1, dst: 3, amount: 100},
        4: {id: 4, src: -1, dst: 4, amount: 100},
    };

    // List of blocks, with initial block
    node.blockchain = [{
        id: 1,
        proposer: -1, // Genesis block
        transactions: initialTransactions,
    }];

    // Map from transaction IDs to objects, for transactions not in a block
    node.mempool = {};

    // Map from node IDs to messages containing random value commitments, for validator selection
    node.validatorValCommits = {};
    // Map from node IDs to messages containing commitment randoms, for validator selection
    node.validatorCommitRandoms = {};
    // Map from node IDs to random values, for validator selection
    node.validatorVals = {};

    node.curValidatorId = null;

    node.curEpochStart = null;

    // Start validation event loop
    node.createEvent(EPOCH_INTERVAL, "selectValidator");
}

async function handleSelectValidatorEvent(node) {
    // Assume all nodes receive select validator event at the same time
    node.curEpochStart = simulator.curTime;

    // Clear data
    node.validatorValCommits = {};
    node.validatorCommitRandoms = {};
    node.validatorVals = {};

    // Make a random value commitment
    const randomDataArray = new Uint32Array(1);
    crypto.getRandomValues(randomDataArray);
    const val = randomDataArray[0];
    const { commit: valCommit, random: commitRandom } = await commitMsg(val);
    node.validatorValCommits[node.id] = valCommit;
    node.validatorCommitRandoms[node.id] = commitRandom;
    node.validatorVals[node.id] = val;

    // Make a message containing the random value commitment and sign it
    const msg = {
        type: "validatorRandomCommit", src: node.id, commit: valCommit,
    };
    const sig = await signMsg(msg, node.signingKeyPair.privateKey);
    const signedMsg = { msg: msg, sig: sig };

    node.broadcastMessage(signedMsg);
    node.createEvent(EPOCH_INTERVAL, "selectValidator");
}

async function handleTransactionMsg(node, msg) {
    // Do nothing if transaction is already known
    if (msg.transaction.id in node.mempool)
        return;

    // Save transaction
    node.mempool[msg.transaction.id] = msg.transaction;
    nodeLogger.info(node, `saved transaction ${msg.transaction.id}`);

    // Gossip to peers
    node.broadcastMessage({
        type: "transaction", transaction: msg.transaction
    });
}

async function handleValidatorRandomValueMsg(node, msg) {
    // Do nothing if value is already known
    if (msg.src in node.validatorRandomValues) {
        return;
    }

    node.validatorRandomValues[msg.src] = msg.value;

    // Gossip to peers
    node.broadcastMessage(msg);

    // If all values have been received, compute validator ID
    if (Object.keys(node.validatorRandomValues).length === NUM_NODES) {
        let sum = 0;
        for (let id in node.validatorRandomValues) {
            sum += node.validatorRandomValues[id];
        }
        node.curValidatorId = sum % NUM_NODES + 1;
        nodeLogger.info(node, `current validator ID ${node.curValidatorId}`);

        if (node.id === node.curValidatorId) {
            proposeBlock(node);
        }
    }
}

async function proposeBlock(node) {
    const block = {
        id: node.blockchain[node.blockchain.length - 1].id + 1,
        proposer: node.id,
        transactions: node.mempool,
    };
    node.mempool = {};

    node.blockchain.push(block);

    node.broadcastMessage({
        type: "block", block: block,
    });
}

async function handleBlockMsg(node, msg) {
    // Do nothing if block is already at head
    if (node.blockchain[node.blockchain.length - 1].id === msg.block.id) {
        return;
    }

    // Delete transactions in mempool that are in the block
    for (let tId in node.mempool) {
        if (tId in msg.block.transactions) {
            delete node.mempool[tId];
        }
    }

    // Add the block to head of blockchain
    node.blockchain.push(msg.block);
    nodeLogger.info(node, `received block ${msg.block.id}`);

    // Gossip to peers
    node.broadcastMessage(msg);
}



// Helpers

const nodeLogger = {
    info: (node, m) => logger.info(`[${node.name}] ${m}`),
    error: (node, m) => logger.error(`[${node.name}] ${m}`),
};

async function signMsg(m, signKey) {
    const data = new TextEncoder().encode(JSON.stringify(m));
    const sigBuf = new Uint8Array(await crypto.subtle.sign({name: "ECDSA", hash: "SHA-256"}, signKey, data));
    const sig = bufToHex(sigBuf);
    return sig;
}

async function verifyMsg(m, sig, verifyKey) {
    const data = new TextEncoder().encode(JSON.stringify(m));
    const sigBuf = hexToBuf(sig);
    const valid = await crypto.subtle.verify({name: "ECDSA", hash: "SHA-256"}, verifyKey, sigBuf, data);
    return valid;
}

async function commitMsg(m) {
    const randomArray = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(randomArray);
    const random = bufToHex(randomArray);

    const msgData = new TextEncoder().encode(JSON.stringify(m));

    const data = new TextEncoder().encode(`${random}|${msgData}`);
    const commitBuf = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
    const commit = bufToHex(commitBuf);
    return { commit, random };
}

async function verifyMsgReveal(m, random, commit) {
    const msgData = new TextEncoder().encode(JSON.stringify(m));

    const data = new TextEncoder().encode(`${random}|${msgData}`);
    const expectedCommitBuf = await crypto.subtle.digest("SHA-256", data);
    const expCommit = bufToHex(expectedCommitBuf);

    if (commit !== expCommit)
        return false;
}

function bufToHex(buf) {
    const hexBytes = [...buf].map(x => x.toString(16).padStart(2, "0"));
    const res = hexBytes.join("");
    return res;
}

function hexToBuf(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        const hexByte = hex.slice(i, i+2);
        const byte = Number.parseInt(hexByte, 16);
        bytes.push(byte);
    }
    const res = new Uint8Array(bytes);
    return res;
}

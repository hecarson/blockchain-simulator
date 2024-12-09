
// Assumptions:
// * All messages have a valid signature and are not forged.
// * All nodes use a unique ID for all new transactions.
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
        time: 0, dst: i, type: "init",
    });
}

// Break after init
simulator.eventQueue.push({
    time: 2, dst: 0, type: "break"
});



// Initial transactions

simulator.eventQueue.push({
    time: 5, dst: 1, type: "initTx", msg: {
        id: 10, src: 1, dst: 2, amount: 10,
    },
});

// bad4 pays good3, bad4 wants to reverse this transaction
simulator.eventQueue.push({
    time: 150, dst: 4, type: "initTx", msg: {
        id: 20, src: 4, dst: 3, amount: 50,
    },
});



// Make a finite number of validator selection rounds
for (let i = 1; i <= 100; i++) {
    simulator.eventQueue.push({
        time: EPOCH_INTERVAL * i - 1, dst: -1, type: "break",
    });

    for (let nodeId = 1; nodeId <= NUM_NODES; nodeId++) {
        simulator.eventQueue.push({
            time: EPOCH_INTERVAL * i, dst: nodeId, type: "selectValidator",
        });
    }
}



// Event handlers

async function nodeEventHandler(node, event, isBad) {
    if (event.type === "init") {
        handleInitEvent(node);
    }
    else if (event.type === "initTx") {
        await handleInitTx(node, event.msg);
    }
    else if (event.type === "msg") {
        if (event.msg.type === "tx") {
            await handleTxMsg(node, event.msg);
        }
        else if (event.msg.type === "block") {
            await handleBlockMsg(node, event.msg);
        }
        else if (event.msg.type === "validatorRandomCommit") {
            await handleValidatorRandomCommitMsg(node, event.msg);
        }
        else if (event.msg.type === "validatorRandomReveal") {
            await handleValidatorRandomRevealMsg(node, event.msg);
        }
        else if (event.msg.type === "validatorIdAck") {
            await handleValidatorIdAckMsg(node, event.msg);
        }
    }
    else if (event.type === "selectValidator") {
        await handleSelectValidatorEvent(node);
    }
}

function handleInitEvent(node) {
    const initialTxs = {
        // src of -1 means currency is newly created
        1: {id: 1, src: -1, dst: 1, amount: 100},
        2: {id: 2, src: -1, dst: 2, amount: 100},
        3: {id: 3, src: -1, dst: 3, amount: 100},
        4: {id: 4, src: -1, dst: 4, amount: 100},
    };

    // Map from node IDs to public keys
    node.publicKeys = {
        1: good1.signingKeyPair.publicKey,
        2: good2.signingKeyPair.publicKey,
        3: good3.signingKeyPair.publicKey,
        4: bad4.signingKeyPair.publicKey,
    };

    // Local copy of blocktree. Initally just contains the genesis block.
    node.blocktreeRoot = {
        id: 1,
        prevId: -1,
        proposer: -1,
        txs: initialTxs,
        branches: {}, // Mapping from block IDs to blocks
    };

    // Map from transaction IDs to objects, for transactions not in a block
    node.mempool = {};

    // Map from node IDs to messages containing random value commitments, for validator selection
    node.validatorValCommits = {};
    // Map from node IDs to messages containing value commitment reveals, for validator selection
    node.validatorValReveals = {};
    // Map from node IDs to booleans indicating whether they have ACKed the current validator ID
    node.validatorIdAcks = {};

    node.curValidatorId = null;

    node.curEpochStart = null;

    // Start validation event loop
    //node.createEvent(EPOCH_INTERVAL, "selectValidator");
}

async function handleInitTx(node, tx) {
    node.mempool[tx.id] = tx;
    nodeLogger.info(node, `saved transaction ${tx.id}`);
    await broadcastSignedMessage(node, "tx", tx);
}

async function handleTxMsg(node, signedMsg) {
    // Verify signature
    const isValid = await verifySignedMessage(node, signedMsg);
    if (!isValid) {
        nodeLogger.error(node, "transaction has invalid signature");
        return;
    }
    const tx = signedMsg.msg;

    // Do nothing if transaction is already known
    if (tx.id in node.mempool)
        return;

    // Save transaction
    node.mempool[tx.id] = tx;
    nodeLogger.info(node, `saved transaction ${tx.id}`);

    // Gossip to peers
    node.broadcastMessage(signedMsg);
}

async function handleSelectValidatorEvent(node) {
    // Assume all nodes receive select validator event at the same time
    node.curEpochStart = simulator.curTime;

    // Clear data
    node.validatorValCommits = {};
    node.validatorValReveals = {};
    node.curValidatorId = null;

    // Make a random value commitment
    const randomDataArray = new Uint32Array(1);
    crypto.getRandomValues(randomDataArray);
    const val = randomDataArray[0];
    const { commit: valCommit, random: commitRandom } = await commitMsg(val);
    node.validatorValCommits[node.id] = valCommit;
    node.validatorValReveals[node.id] = { val: val, random: commitRandom };
    nodeLogger.info(node, `generated and committed val ${val}`);

    // Broadcast a message containing the random value commitment
    await broadcastSignedMessage(node, "validatorRandomCommit", valCommit);

    // Make next selectValidator event
    //node.createEvent(EPOCH_INTERVAL, "selectValidator");
}

async function handleValidatorRandomCommitMsg(node, signedMsg) {
    // Verify signature
    const isValid = await verifySignedMessage(node, signedMsg);
    if (!isValid) {
        nodeLogger.error(node, "validator random commit signature is invalid");
        return;
    }
    const valCommit = signedMsg.msg;

    // Do nothing if commit is already known
    if (signedMsg.src in node.validatorValCommits)
        return;
    node.validatorValCommits[signedMsg.src] = valCommit;
    nodeLogger.info(node, `received val commit from ${signedMsg.src}`);

    // Gossip to peers
    node.broadcastMessage(signedMsg);

    // If all commits have been received, reveal value
    if (Object.keys(node.validatorValCommits).length === NUM_NODES) {
        const valReveal = node.validatorValReveals[node.id];
        await broadcastSignedMessage(node, "validatorRandomReveal", valReveal);
    }
}

async function handleValidatorRandomRevealMsg(node, signedMsg) {
    // Verify signature
    const isSigValid = await verifySignedMessage(node, signedMsg);
    if (!isSigValid) {
        nodeLogger.error(node, "validator random reveal signature is invalid");
        return;
    }
    const valReveal = signedMsg.msg;

    // Do nothing if reveal is already known
    if (signedMsg.src in node.validatorValReveals)
        return;
    node.validatorValReveals[signedMsg.src] = valReveal;

    // Verify reveal
    const valCommit = node.validatorValCommits[signedMsg.src];
    const isRevealValid = await verifyMsgReveal(valReveal.val, valReveal.random, valCommit);
    if (!isRevealValid) {
        nodeLogger.error(node, `validator random reveal from node ${signedMsg.src} is invalid`);
        return;
    }
    nodeLogger.info(node, `received val reveal from node ${signedMsg.src}, val ${valReveal.val}`);

    // Gossip to peers
    node.broadcastMessage(signedMsg);

    // If all reveals have been received, compute validator ID
    if (Object.keys(node.validatorValReveals).length === NUM_NODES) {
        const sum = Object.keys(node.validatorValReveals).reduce(
            (sum, key) => sum + node.validatorValReveals[key].val,
            0,
        );
        node.curValidatorId = sum % NUM_NODES + 1;
        nodeLogger.info(node, `current validator ${node.curValidatorId}`);

        // Broadcast acknowledgement
        node.validatorIdAcks[node.id] = true;
        const idAck = { epoch: node.curEpochStart };
        await broadcastSignedMessage(node, "validatorIdAck", idAck);
    }
}

async function handleValidatorIdAckMsg(node, signedMsg) {
    // Verify signature
    const isSigValid = await verifySignedMessage(node, signedMsg);
    if (!isSigValid) {
        nodeLogger.error(node, "validator id ack signature is invalid");
        return;
    }

    // Ignore if already seen
    if (signedMsg.src in node.validatorIdAcks)
        return;
    const idAck = signedMsg.msg;

    if (idAck.epoch !== node.curEpochStart) {
        nodeLogger.error(node, "validator id ack has incorrect epoch");
        return;
    }
    node.validatorIdAcks[signedMsg.src] = true;

    if (node.curValidatorId === node.id)
        nodeLogger.info(node, `received validator id ACK from node ${signedMsg.src}`);

    // Gossip to peers
    node.broadcastMessage(signedMsg);

    // If all ACKs have been received, and if current node is block proposer, propose block
    if (Object.keys(node.validatorIdAcks).length === NUM_NODES && node.curValidatorId === node.id) {
        await proposeBlock(node);
    }
}

async function proposeBlock(node) {
    nodeLogger.info(node, "proposing block");

    const blockId = getMaxIdOfBlocktree(node.blocktreeRoot) + 1;
    const { block: headBlock }  = getLongestChainBlock(node.blocktreeRoot, 1);
    const block = {
        id: blockId,
        prevId: headBlock.id,
        proposer: node.id,
        txs: node.mempool,
        branches: {},
    };
    node.mempool = {};
    nodeLogger.info(node, `created block ${block.prevId} -> ${block.id}`);

    headBlock.branches[blockId] = block;

    await broadcastSignedMessage(node, "block", block);
}

async function handleBlockMsg(node, signedMsg) {
    // Verify signature
    const isSigValid = await verifySignedMessage(node, signedMsg);
    if (!isSigValid) {
        nodeLogger.error("block has invalid signature");
        return;
    }
    const block = signedMsg.msg;

    // Ignore if already known
    if (getBlock(node.blocktreeRoot, block.id) !== null)
        return;

    // Check that proposer is correct
    if (block.proposer !== node.curValidatorId) {
        nodeLogger.error(`block ${block.id} has incorrect proposer`);
        return;
    }

    // Save block
    const prevBlock = getBlock(node.blocktreeRoot, block.prevId);
    if (prevBlock === null) {
        nodeLogger.error(`prev block ${block.prevId} does not exist in blocktree`);
        return;
    }
    prevBlock.branches[block.id] = block;
    nodeLogger.info(node, `received block ${block.id}`);

    // Delete transactions in mempool that are in the block
    for (let txId in node.mempool) {
        if (txId in block.txs) {
            delete node.mempool[txId];
        }
    }

    // Gossip to peers
    node.broadcastMessage(signedMsg);
}



// Helpers

const nodeLogger = {
    info: (node, m) => logger.info(`[${node.name}] ${m}`),
    error: (node, m) => logger.error(`[${node.name}] ${m}`),
};

async function signMsg(msg, signKey) {
    const data = new TextEncoder().encode(JSON.stringify(msg));
    const sigBuf = new Uint8Array(await crypto.subtle.sign({name: "ECDSA", hash: "SHA-256"}, signKey, data));
    const sig = bufToHex(sigBuf);
    return sig;
}

async function verifyMsg(msg, sig, verifyKey) {
    const data = new TextEncoder().encode(JSON.stringify(msg));
    const sigBuf = hexToBuf(sig);
    const valid = await crypto.subtle.verify({name: "ECDSA", hash: "SHA-256"}, verifyKey, sigBuf, data);
    return valid;
}

async function commitMsg(msg) {
    const randomArray = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(randomArray);
    const random = bufToHex(randomArray);

    const msgData = new TextEncoder().encode(JSON.stringify(msg));

    const data = new TextEncoder().encode(`${random}|${msgData}`);
    const commitBuf = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
    const commit = bufToHex(commitBuf);
    return { commit, random };
}

async function verifyMsgReveal(msg, random, commit) {
    const msgData = new TextEncoder().encode(JSON.stringify(msg));

    const data = new TextEncoder().encode(`${random}|${msgData}`);
    const expectedCommitBuf = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
    const expCommit = bufToHex(expectedCommitBuf);

    return commit === expCommit;
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

async function broadcastSignedMessage(node, type, msg) {
    const sig = await signMsg(msg, node.signingKeyPair.privateKey);
    const signedMsg = {
        type: type, src: node.id, msg: msg, sig: sig,
    };
    node.broadcastMessage(signedMsg);
}

async function verifySignedMessage(node, signedMsg) {
    const verifyKey = node.publicKeys[signedMsg.src];
    const res = await verifyMsg(signedMsg.msg, signedMsg.sig, verifyKey);
    return res;
}

// Gets the maximum ID of all blocks in the blocktree
function getMaxIdOfBlocktree(blocktreeRoot) {
    let maxId = blocktreeRoot.id;

    for (let nextBlockId in blocktreeRoot.branches) {
        const nextMaxId = getMaxIdOfBlocktree(blocktreeRoot.branches[nextBlockId]);
        maxId = Math.max(maxId, nextMaxId);
    }

    return maxId;
}

// Returns the last block in the longest chain from the root, and its height.
// Initial call should be `getLongestChainBlock(blocktreeRoot, 1)`.
function getLongestChainBlock(blocktreeRoot, height) {
    if (Object.keys(blocktreeRoot.branches).length === 0)
        return { block: blocktreeRoot, height: height };

    let longestChainBlock = null;
    let longestChainHeight = null;

    for (let nextBlockId in blocktreeRoot.branches) {
        const { block: nextBlock, height: nextHeight } =
            getLongestChainBlock(blocktreeRoot.branches[nextBlockId], height + 1);
        if (nextHeight > longestChainHeight) {
            longestChainHeight = nextHeight;
            longestChainBlock = nextBlock;
        }
    }

    return { block: longestChainBlock, height: longestChainHeight };
}

// Returns the block in the blocktree by ID, or null.
function getBlock(blocktreeRoot, id) {
    if (blocktreeRoot.id === id)
        return blocktreeRoot;

    for (let nextBlockId in blocktreeRoot.branches) {
        const block = getBlock(blocktreeRoot.branches[nextBlockId], id);
        if (block !== null)
            return block;
    }

    return null;
}

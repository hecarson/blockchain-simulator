

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
    logger.info(`init node ${node.id}`);
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

for (let i = 1; i <= 4; i++) {
    simulator.eventQueue.push({
        time: 0, dst: i, type: "init", isBreakpoint: false
    });
}

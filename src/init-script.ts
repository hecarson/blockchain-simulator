// Initial init script that is shown in the init window
// Currently unused

export const initInitScript =
    "function node1EventHandler(event) {\n" +
    "    logger.info(\"[node1] received event:\")\n" +
    "    logger.info(event)\n" +
    "}\n" +
    "\n" +
    "const node1 = simulator.createNewNode(\n" +
    "    1,\n" +
    "    \"node1\",\n" +
    "    { x: 0.5, y: 0.5 },\n" +
    "    \"white\",\n" +
    "    [2],\n" +
    "    node1EventHandler,\n" +
    ");\n" +
    "const node2 = simulator.createNewNode(\n" +
    "    2,\n" +
    "    \"node2\",\n" +
    "    { x: 0.3, y: 0.5 },\n" +
    "    \"red\",\n" +
    "    [1, 3],\n" +
    "    node1EventHandler,\n" +
    ");\n" +
    "const node3 = simulator.createNewNode(\n" +
    "    3,\n" +
    "    \"node3\",\n" +
    "    { x: 0.7, y: 0.2 },\n" +
    "    \"orange\",\n" +
    "    [2],\n" +
    "    node1EventHandler,\n" +
    ");\n" +
    "\n" +
    "simulator.eventQueue.push({\n" +
    "    time: 5,\n" +
    "    dst: 1,\n" +
    "    type: \"test\",\n" +
    "    isBreakpoint: false,\n" +
    "});\n" +
    "simulator.eventQueue.push({\n" +
    "    time: 7,\n" +
    "    dst: 2,\n" +
    "    type: \"test\",\n" +
    "    isBreakpoint: true,\n" +
    "});\n" +
    ""
;

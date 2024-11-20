// Initial init script that is shown in the init window

export const initInitScript =
    "function node1EventHandler(event) {\n" +
    "    logger.info(\"[node1] received event:\")\n" +
    "    logger.info(event)\n" +
    "}\n" +
    "\n" +
    "const node1 = simulator.createNewNode(\n" +
    "    { x: 0.5, y: 0.5},\n" +
    "    \"node1\",\n" +
    "    \"white\",\n" +
    "    node1EventHandler,\n" +
    ");\n"
;

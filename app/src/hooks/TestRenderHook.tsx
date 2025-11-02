function testRenderHook(specificTestHook: (collectMetrics: Boolean) => {}, collectMetrics: Boolean = false) {
    return specificTestHook(collectMetrics);
}

export default testRenderHook;
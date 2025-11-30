// ============================================================================
// Route de santé de l'API
// ============================================================================

function healthRoutes(fastify) {
    fastify.get('/api/health', () => {
        return { status: 'ok', message: 'API Dashboard opérationnelle' };
    });
}

module.exports = healthRoutes;

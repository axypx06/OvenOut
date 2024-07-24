const Order = require('../../../models/order');

function statusController() {
    return {
        async update(req, res) {
            try {
                const { orderId, status } = req.body;

                const updateResult = await Order.updateOne({ _id: orderId }, { status });

                if (updateResult.nModified === 0) {
                    return res.status(404).send('Order not found or status not modified');
                }

                // Emit event
                const eventEmitter = req.app.get('eventEmitter');
                eventEmitter.emit('orderUpdated', { id: orderId, status });

                return res.redirect('/admin/orders');
            } catch (err) {
                console.error(err);
                return res.status(500).send('Internal server error');
            }
        }
    }
}

module.exports = statusController;
